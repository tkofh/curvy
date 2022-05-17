import { quadraticRoots } from '@curvy/math'

export const getAxisPrimeRoots = (a: number, b: number, c: number): number[] => {
  const [root1, root2] = quadraticRoots(a, b, c)

  const roots: number[] = []

  if (root1 !== root2) {
    if (root1 !== undefined && root1 > 0 && root1 < 1) {
      roots.push(root1)
    }
    if (root2 !== undefined && root2 > 0 && root2 < 1) {
      roots.push(root2)
    }
  }

  return roots
}
