import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { isApiClientError, ordersApi, walletsApi } from '@/api';
import type { Cart, CreateOrderRequest, Profile, Quote, Wallet } from '@/contracts';
import { useProfile, useWallets } from '@/features/account/queries';
import { useCart, useCartOwnerId } from '@/features/cart/queries';
import {
  cartToQuoteLines,
  couponStore,
  quoteOptions,
  useCouponCode,
  useQuote,
} from '@/features/cart/quote';
import { orderKeys } from '@/features/orders/queries';
import { errorMessage } from '@/lib/error-message';
import { applyApiErrors } from '@/lib/form-errors';

import { useCurrentUser } from '@/features/auth/session-store';

import { checkoutDraft, hashPayload, idempotencyStore } from './checkout-storage';

const ANONYMOUS = 'anonymous';
import { collectorSchema, type CollectorFormValues } from './schemas';

export type ConnectionState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'connected'; address: string }
  | { status: 'rejected'; message: string }
  | { status: 'error'; message: string };

export type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'timeout'; message: string }
  | { status: 'error'; message: string };

const EMPTY: CollectorFormValues = {
  displayName: '',
  network: '' as CollectorFormValues['network'],
  walletAddress: '',
  walletType: '' as CollectorFormValues['walletType'],
  email: '',
  username: '',
  profileName: '',
  secondaryAddress: '',
  referralCode: '',
  ensName: '',
  note: '',
};

function valuesFrom(
  profile: Profile,
  wallet: Wallet | null,
  previous: Partial<CollectorFormValues>,
): CollectorFormValues {
  return {
    ...EMPTY,
    ...previous,
    displayName: previous.displayName || profile.displayName,
    username: previous.username || profile.username,
    email: previous.email || profile.email,
    ensName: previous.ensName || wallet?.ensName || profile.ensName || '',
    profileName: previous.profileName || wallet?.profileName || profile.displayName,
    network: wallet?.network ?? previous.network ?? EMPTY.network,
    walletAddress: wallet?.address ?? previous.walletAddress ?? '',
    walletType: wallet?.walletType ?? previous.walletType ?? EMPTY.walletType,
    secondaryAddress: wallet?.secondaryAddress ?? previous.secondaryAddress ?? '',
    referralCode: previous.referralCode || wallet?.referralCode || '',
  };
}

/**
 * Orquestra o pagamento: formulário do colecionador, carteira selecionada, conexão simulada,
 * cotação revalidada, revisão, criação idempotente do pedido e recuperação após timeout.
 */
export function useCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const wallets = useWallets();
  const cart = useCart();
  const ownerId = useCartOwnerId();
  const couponCode = useCouponCode();
  const quote = useQuote(ownerId, cart.data, couponCode, 'checkout');

  const userId = useCurrentUser()?.id ?? ANONYMOUS;
  const draft = useMemo(() => checkoutDraft.read(userId), [userId]);
  const [chosenWalletId, setWalletId] = useState<string | null>(draft?.walletId ?? null);
  const [connection, setConnection] = useState<ConnectionState>({ status: 'idle' });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const [acknowledged, setAcknowledged] = useState<string | null>(null);
  // Conteúdo congelado na revisão: a confirmação (e qualquer nova tentativa) envia exatamente isto.
  const [snapshot, setSnapshot] = useState<{ cart: Cart; quote: Quote } | null>(null);
  const prefilled = useRef(false);

  const form = useForm<CollectorFormValues>({
    resolver: zodResolver(collectorSchema),
    defaultValues: { ...EMPTY, ...draft?.values },
  });

  const primary = wallets.data?.find((wallet) => wallet.kind === 'primary') ?? null;
  const secondary = wallets.data?.find((wallet) => wallet.kind === 'secondary') ?? null;
  // Sem escolha explícita, a carteira principal é a selecionada (derivado, sem estado extra).
  const walletId = chosenWalletId ?? primary?.id ?? null;
  const selectedWallet = wallets.data?.find((wallet) => wallet.id === walletId) ?? primary;

  const watched = useWatch({ control: form.control });
  // Pré-preenche o formulário uma única vez com perfil + carteira selecionada (ou o rascunho salvo).
  useEffect(() => {
    if (prefilled.current || !profile.data || !wallets.data) return;
    prefilled.current = true;
    const wallet = wallets.data.find((item) => item.id === walletId) ?? primary;
    // O que o usuário já digitou antes do perfil chegar tem prioridade sobre o pré-preenchimento.
    const typed = Object.fromEntries(
      Object.entries(form.getValues()).filter(([, value]) => value !== ''),
    ) as Partial<CollectorFormValues>;
    form.reset(valuesFrom(profile.data, wallet, { ...draft?.values, ...typed }));
  }, [profile.data, wallets.data, walletId, primary, form, draft]);

  // Rascunho: qualquer alteração é guardada para sobreviver a refresh e expiração de sessão.
  useEffect(() => {
    // Sem sessão (expirou durante o preenchimento) nada é gravado: o rascunho segue do dono.
    if (!prefilled.current || userId === ANONYMOUS) return;
    checkoutDraft.write({ userId, values: watched as Partial<CollectorFormValues>, walletId });
  }, [watched, walletId, userId]);

  const selectWallet = useCallback(
    (wallet: Wallet) => {
      setWalletId(wallet.id);
      setConnection({ status: 'idle' });
      form.setValue('network', wallet.network, { shouldValidate: true });
      form.setValue('walletAddress', wallet.address, { shouldValidate: true });
      form.setValue('walletType', wallet.walletType, { shouldValidate: true });
      form.setValue('secondaryAddress', wallet.secondaryAddress ?? '');
      form.setValue('ensName', wallet.ensName);
      form.setValue('profileName', wallet.profileName);
      checkoutDraft.write({ userId, values: form.getValues(), walletId: wallet.id });
    },
    [form, userId],
  );

  const connect = useMutation({
    mutationFn: ({ id, network }: { id: string; network: CollectorFormValues['network'] }) =>
      walletsApi.connect(id, { network }),
  });

  const disconnect = useCallback(async () => {
    if (selectedWallet && connection.status === 'connected') {
      try {
        await walletsApi.disconnect(selectedWallet.id);
      } catch {
        // A desconexão local vale mesmo que a API falhe.
      }
    }
    setConnection({ status: 'idle' });
    setReviewOpen(false);
  }, [selectedWallet, connection.status]);

  const quoteChanged = Boolean(
    quote.data && acknowledged && quote.data.fingerprint !== acknowledged,
  );
  const blockingIssues = (quote.data?.issues ?? []).filter(
    (issue) => issue.type !== 'price_changed',
  );

  /** Passo 1: valida o formulário, conecta a carteira e revalida a cotação; abre a revisão. */
  const startReview = form.handleSubmit(async (values) => {
    if (!selectedWallet) {
      form.setError('walletAddress', {
        type: 'manual',
        message: 'Cadastre uma carteira em Carteiras antes de pagar.',
      });
      return;
    }
    setSubmit({ status: 'idle' });
    setConnection({ status: 'connecting' });
    try {
      const result = await connect.mutateAsync({ id: selectedWallet.id, network: values.network });
      setConnection({ status: 'connected', address: result.address });
    } catch (error) {
      const message = errorMessage(error, 'Não foi possível conectar a carteira.');
      setConnection({
        status: isApiClientError(error) && error.type === 'wallet_rejected' ? 'rejected' : 'error',
        message,
      });
      return;
    }
    const fresh = await queryClient.fetchQuery({
      ...quoteOptions(ownerId, cart.data, couponCode, 'checkout'),
      staleTime: 0,
    });
    if (!cart.data) return;
    setAcknowledged(fresh.fingerprint);
    setSnapshot({ cart: cart.data, quote: fresh });
    setReviewOpen(true);
  });

  const createOrder = useMutation({
    mutationFn: ({ body, key }: { body: CreateOrderRequest; key: string }) =>
      ordersApi.create(body, key),
  });

  /** Passo 2: cria o pedido com chave de idempotência; a mesma tentativa reutiliza a chave. */
  const confirm = useCallback(async () => {
    if (!selectedWallet || !snapshot) return;
    const values = form.getValues();
    const body: CreateOrderRequest = {
      items: cartToQuoteLines(snapshot.cart),
      couponCode: couponCode || null,
      quoteFingerprint: snapshot.quote.fingerprint,
      walletId: selectedWallet.id,
      network: values.network,
      collector: {
        displayName: values.displayName,
        username: values.username,
        profileName: values.profileName,
        email: values.email,
        network: values.network,
        walletAddress: values.walletAddress,
        walletType: values.walletType,
        secondaryAddress: values.secondaryAddress || undefined,
        referralCode: values.referralCode,
        ensName: values.ensName,
        note: values.note || undefined,
      },
    };
    const key = idempotencyStore.keyFor(
      userId,
      hashPayload({
        items: body.items,
        couponCode: body.couponCode,
        walletId: body.walletId,
        network: body.network,
      }),
    );
    setSubmit({ status: 'submitting' });
    try {
      const order = await createOrder.mutateAsync({ body, key });
      idempotencyStore.clear();
      checkoutDraft.clear();
      couponStore.set('');
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      setReviewOpen(false);
      setSubmit({ status: 'idle' });
      await navigate({ to: '/pedidos/$orderId', params: { orderId: order.id }, replace: true });
    } catch (error) {
      if (isApiClientError(error) && (error.isTimeout || error.isNetworkError)) {
        setSubmit({
          status: 'timeout',
          message:
            'A confirmação demorou mais que o esperado. Você pode tentar novamente sem risco de criar outro pedido.',
        });
        return;
      }
      if (isApiClientError(error) && error.type === 'quote_outdated') {
        // Mantém o fingerprint aceito: a nova cotação fica "diferente" até o usuário aceitar de novo.
        setReviewOpen(false);
        setSubmit({ status: 'error', message: error.message });
        await queryClient.invalidateQueries({ queryKey: ['quote'] });
        return;
      }
      if (isApiClientError(error) && error.type === 'availability_conflict') {
        setReviewOpen(false);
        setSubmit({ status: 'error', message: error.message });
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
        return;
      }
      if (isApiClientError(error) && error.type === 'validation_error') {
        setReviewOpen(false);
        const general = applyApiErrors(error, form.setError, [
          'displayName',
          'network',
          'walletAddress',
          'walletType',
          'email',
          'username',
          'profileName',
          'secondaryAddress',
          'referralCode',
          'ensName',
        ]);
        setSubmit({ status: 'error', message: general ?? 'Revise os campos destacados.' });
        return;
      }
      setSubmit({
        status: 'error',
        message: errorMessage(error, 'Não foi possível criar o pedido.'),
      });
    }
  }, [snapshot, selectedWallet, form, couponCode, createOrder, queryClient, navigate, userId]);

  const acknowledgeQuote = useCallback(() => {
    if (!quote.data) return;
    setAcknowledged(quote.data.fingerprint);
    setSubmit({ status: 'idle' });
  }, [quote.data]);

  return {
    form,
    profile,
    wallets,
    cart,
    quote,
    couponCode,
    primary,
    secondary,
    selectedWallet,
    selectWallet,
    connection,
    disconnect,
    startReview,
    reviewOpen,
    snapshot,
    closeReview: () => {
      if (submit.status !== 'submitting') setReviewOpen(false);
    },
    confirm,
    submit,
    quoteChanged,
    acknowledgeQuote,
    blockingIssues,
    isPreparing:
      connect.isPending || (quote.isFetching && connection.status === 'connected' && !reviewOpen),
  };
}

export type CheckoutController = ReturnType<typeof useCheckout>;
