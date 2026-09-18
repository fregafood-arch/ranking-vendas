/**
 * Constrói a URL pública de um objeto do bucket 'seller-photos' a partir do
 * caminho salvo em sellers.photo_path. Função pura (sem chamada de rede),
 * usável tanto em Server quanto em Client Components — o bucket é público
 * e os caminhos usam UUID, então a URL em si não precisa de assinatura.
 */
export function getSellerPhotoUrl(photoPath: string | null | undefined): string | null {
  if (!photoPath) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base}/storage/v1/object/public/seller-photos/${photoPath}`;
}
