export type SupportedModelExtension = 'glb' | 'gltf' | 'obj' | 'stl';

export function getModelExtension(url: string): SupportedModelExtension | null {
  const pathOnly = (url.split('?')[0] ?? '').trim();
  const ext = pathOnly.split('.').pop()?.toLowerCase();
  if (ext === 'glb' || ext === 'gltf' || ext === 'obj' || ext === 'stl') return ext;
  return null;
}
