export function normalizarCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validarCPF(valor: string): boolean {
  const cpf = normalizarCPF(valor)

  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0

    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i)
    }

    const resto = (soma * 10) % 11
    const digito = resto === 10 ? 0 : resto

    if (digito !== Number(cpf[tamanho])) {
      return false
    }
  }

  return true
}

export function formatarCPF(valor: string): string {
  return normalizarCPF(valor)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function mascararCPF(valor: string): string {
  const cpf = normalizarCPF(valor)

  if (cpf.length !== 11) return ''

  return `***.***.***-${cpf.slice(-2)}`
}
