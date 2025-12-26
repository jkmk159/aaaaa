
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

/** 
 * MAPEAMENTO CONFORME SUA CONFIGURAÇÃO:
 * SERVICE_ROLE_KEY -> Contém sua Secret Key do Stripe (sk_...)
 * PROJECT_URL      -> Contém seu Webhook Secret (whsec_...)
 */
const stripe = new Stripe((Deno as any).env.get("SERVICE_ROLE_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Sem assinatura", { status: 400 })
  }

  try {
    const body = await req.text()
    
    // Usando o nome que você definiu no painel para o segredo do webhook
    const endpointSecret = (Deno as any).env.get("PROJECT_URL")
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret!,
      undefined,
      cryptoProvider
    )

    // O Supabase injeta automaticamente as variáveis internas SUPABASE_URL 
    // e SUPABASE_SERVICE_ROLE_KEY para a função funcionar internamente.
    const supabase = createClient(
      (Deno as any).env.get("SUPABASE_URL")!,
      (Deno as any).env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id
      const customerId = session.customer

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            stripe_customer_id: customerId 
          })
          .eq('id', userId)
        
        if (error) throw error
        console.log(`SUCESSO: Usuário ${userId} ativado como PRO.`)
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'invoice.payment_failed') {
      const subscription = event.data.object
      const customerId = subscription.customer

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .eq('stripe_customer_id', customerId)
      
      if (error) throw error
      console.log(`EXPIRADO: Cliente ${customerId} perdeu acesso PRO.`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error(`Erro no Webhook: ${err.message}`)
    return new Response(`Erro: ${err.message}`, { status: 400 })
  }
})
