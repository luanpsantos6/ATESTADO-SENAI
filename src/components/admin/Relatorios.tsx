'use client'

import { useMemo, useState } from 'react'
import { formatDate, formatDateTime } from '@/lib/format'

// ---------- tipos dos dados recebidos do servidor ----------
type Atestado = {
  id: string; aluno: string; email: string; turmaIds: string[]; turmas: string[]
  unidadeIds: string[]; unidades: string[]; inicio: string; fim: string; dias: number
  status: string; enviadoEm: string; motivo: string; observacao: string; faltas: number
}
type Falta = {
  id: string; aluno: string; email: string; dataFalta: string; turmaId: string; turma: string
  unidadeId: string; unidade: string; inicio: string; fim: string; observacao: string
}
type Atraso = {
  id: string; aluno: string; email: string; turmaIds: string[]; turmas: string[]
  unidadeIds: string[]; unidades: string[]; data: string; horario: string
  categoria: string; categoriaRotulo: string; descricao: string; comprovante: boolean
  status: string; motivo: string; enviadoEm: string
}
type Usuario = { id: string; nome: string; email: string; perfil: string; ativo: boolean; criadoEm: string }
type Turma = {
  id: string; nome: string; ano: number; unidadeId: string; unidade: string
  professorId: string; professor: string; alunos: number
}
type Matricula = {
  id: string; aluno: string; email: string; turmaId: string; turma: string
  ano: number; unidadeId: string; unidade: string
}
export type DadosRelatorio = {
  atestados: Atestado[]; faltas: Falta[]; atrasos: Atraso[]; usuarios: Usuario[]; turmas: Turma[]; matriculas: Matricula[]
  opcoes: {
    turmas: { id: string; nome: string }[]
    unidades: { id: string; nome: string }[]
    professores: { id: string; nome: string }[]
    categorias: { id: string; nome: string }[]
    anos: number[]
  }
}

type Tipo = 'atestados' | 'faltas' | 'atrasos' | 'usuarios' | 'turmas' | 'matriculas'
type Coluna<T> = { key: string; label: string; get: (r: T) => string | number }
type Agrupador<T> = { key: string; label: string; chaves: (r: T) => string[] }

const SEM = '(não informado)'
const dia = (v: string) => (v ? formatDate(v.slice(0, 10)) : '')
const rotuloStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const rotuloPerfil: Record<string, string> = { admin: 'Administrador', professor: 'Professor', aluno: 'Aluno' }
const mes = (v: string) => (v ? `${v.slice(5, 7)}/${v.slice(0, 4)}` : SEM)
const lista = (a: string[]) => (a.length ? a : [SEM])

// ---------- definição de cada relatório ----------
const COL_ATESTADOS: Coluna<Atestado>[] = [
  { key: 'aluno', label: 'Aluno', get: (r) => r.aluno },
  { key: 'email', label: 'E-mail', get: (r) => r.email },
  { key: 'turmas', label: 'Turma(s)', get: (r) => r.turmas.join(', ') },
  { key: 'unidades', label: 'Unidade(s)', get: (r) => r.unidades.join(', ') },
  { key: 'inicio', label: 'Início', get: (r) => dia(r.inicio) },
  { key: 'fim', label: 'Fim', get: (r) => dia(r.fim) },
  { key: 'dias', label: 'Dias', get: (r) => r.dias },
  { key: 'status', label: 'Status', get: (r) => rotuloStatus(r.status) },
  { key: 'enviado', label: 'Enviado em', get: (r) => (r.enviadoEm ? formatDateTime(r.enviadoEm) : '') },
  { key: 'faltas', label: 'Faltas abonadas', get: (r) => r.faltas },
  { key: 'motivo', label: 'Motivo da rejeição', get: (r) => r.motivo },
  { key: 'obs', label: 'Observação', get: (r) => r.observacao },
]
const GRP_ATESTADOS: Agrupador<Atestado>[] = [
  { key: 'status', label: 'Status', chaves: (r) => [rotuloStatus(r.status)] },
  { key: 'turma', label: 'Turma', chaves: (r) => lista(r.turmas) },
  { key: 'unidade', label: 'Unidade', chaves: (r) => lista(r.unidades) },
  { key: 'aluno', label: 'Aluno', chaves: (r) => [r.aluno || SEM] },
  { key: 'mes', label: 'Mês de envio', chaves: (r) => [mes(r.enviadoEm.slice(0, 10))] },
]

const COL_FALTAS: Coluna<Falta>[] = [
  { key: 'aluno', label: 'Aluno', get: (r) => r.aluno },
  { key: 'email', label: 'E-mail', get: (r) => r.email },
  { key: 'data', label: 'Data da falta', get: (r) => dia(r.dataFalta) },
  { key: 'turma', label: 'Turma', get: (r) => r.turma },
  { key: 'unidade', label: 'Unidade', get: (r) => r.unidade },
  { key: 'periodo', label: 'Período do atestado', get: (r) => (r.inicio ? `${dia(r.inicio)} a ${dia(r.fim)}` : '') },
  { key: 'obs', label: 'Observação', get: (r) => r.observacao },
]
const GRP_FALTAS: Agrupador<Falta>[] = [
  { key: 'aluno', label: 'Aluno', chaves: (r) => [r.aluno || SEM] },
  { key: 'turma', label: 'Turma', chaves: (r) => [r.turma || SEM] },
  { key: 'unidade', label: 'Unidade', chaves: (r) => [r.unidade || SEM] },
  { key: 'mes', label: 'Mês da falta', chaves: (r) => [mes(r.dataFalta)] },
]

const COL_ATRASOS: Coluna<Atraso>[] = [
  { key: 'aluno', label: 'Aluno', get: (r) => r.aluno },
  { key: 'email', label: 'E-mail', get: (r) => r.email },
  { key: 'turmas', label: 'Turma(s)', get: (r) => r.turmas.join(', ') },
  { key: 'unidades', label: 'Unidade(s)', get: (r) => r.unidades.join(', ') },
  { key: 'data', label: 'Data do atraso', get: (r) => dia(r.data) },
  { key: 'horario', label: 'Horário de chegada', get: (r) => r.horario },
  { key: 'categoria', label: 'Motivo', get: (r) => r.categoriaRotulo },
  { key: 'descricao', label: 'Explicação', get: (r) => r.descricao },
  { key: 'status', label: 'Status', get: (r) => rotuloStatus(r.status) },
  { key: 'comprovante', label: 'Comprovante', get: (r) => (r.comprovante ? 'Sim' : 'Não') },
  { key: 'motivoRej', label: 'Motivo da rejeição', get: (r) => r.motivo },
  { key: 'enviado', label: 'Enviado em', get: (r) => (r.enviadoEm ? formatDateTime(r.enviadoEm) : '') },
]
const GRP_ATRASOS: Agrupador<Atraso>[] = [
  { key: 'status', label: 'Status', chaves: (r) => [rotuloStatus(r.status)] },
  { key: 'categoria', label: 'Motivo', chaves: (r) => [r.categoriaRotulo] },
  { key: 'turma', label: 'Turma', chaves: (r) => lista(r.turmas) },
  { key: 'unidade', label: 'Unidade', chaves: (r) => lista(r.unidades) },
  { key: 'aluno', label: 'Aluno', chaves: (r) => [r.aluno || SEM] },
  { key: 'mes', label: 'Mês do atraso', chaves: (r) => [mes(r.data)] },
]

const COL_USUARIOS: Coluna<Usuario>[] = [
  { key: 'nome', label: 'Nome', get: (r) => r.nome },
  { key: 'email', label: 'E-mail', get: (r) => r.email },
  { key: 'perfil', label: 'Perfil', get: (r) => rotuloPerfil[r.perfil] ?? r.perfil },
  { key: 'ativo', label: 'Situação', get: (r) => (r.ativo ? 'Ativo' : 'Desativado') },
  { key: 'criado', label: 'Cadastrado em', get: (r) => (r.criadoEm ? formatDateTime(r.criadoEm) : '') },
]
const GRP_USUARIOS: Agrupador<Usuario>[] = [
  { key: 'perfil', label: 'Perfil', chaves: (r) => [rotuloPerfil[r.perfil] ?? r.perfil] },
  { key: 'ativo', label: 'Situação', chaves: (r) => [r.ativo ? 'Ativo' : 'Desativado'] },
]

const COL_TURMAS: Coluna<Turma>[] = [
  { key: 'nome', label: 'Turma', get: (r) => r.nome },
  { key: 'ano', label: 'Ano letivo', get: (r) => r.ano },
  { key: 'unidade', label: 'Unidade', get: (r) => r.unidade },
  { key: 'professor', label: 'Professor', get: (r) => r.professor },
  { key: 'alunos', label: 'Alunos matriculados', get: (r) => r.alunos },
]
const GRP_TURMAS: Agrupador<Turma>[] = [
  { key: 'unidade', label: 'Unidade', chaves: (r) => [r.unidade || SEM] },
  { key: 'ano', label: 'Ano letivo', chaves: (r) => [String(r.ano)] },
  { key: 'professor', label: 'Professor', chaves: (r) => [r.professor || SEM] },
]

const COL_MATRICULAS: Coluna<Matricula>[] = [
  { key: 'aluno', label: 'Aluno', get: (r) => r.aluno },
  { key: 'email', label: 'E-mail', get: (r) => r.email },
  { key: 'turma', label: 'Turma', get: (r) => r.turma },
  { key: 'ano', label: 'Ano letivo', get: (r) => r.ano },
  { key: 'unidade', label: 'Unidade', get: (r) => r.unidade },
]
const GRP_MATRICULAS: Agrupador<Matricula>[] = [
  { key: 'turma', label: 'Turma', chaves: (r) => [r.turma || SEM] },
  { key: 'unidade', label: 'Unidade', chaves: (r) => [r.unidade || SEM] },
]

const TITULOS: Record<Tipo, string> = {
  atestados: 'Atestados',
  faltas: 'Faltas abonadas',
  atrasos: 'Justificativas de atraso',
  usuarios: 'Usuários',
  turmas: 'Turmas',
  matriculas: 'Matrículas (aluno × turma)',
}

const normaliza = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const contem = (alvo: string, busca: string) => {
  const termos = normaliza(busca).split(/\s+/).filter(Boolean)
  const a = normaliza(alvo)
  return termos.every((t) => a.includes(t))
}

const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500'

export default function Relatorios({ dados }: { dados: DadosRelatorio }) {
  const [tipo, setTipo] = useState<Tipo>('atestados')
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [categoria, setCategoria] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [perfil, setPerfil] = useState('')
  const [situacao, setSituacao] = useState('')
  const [ano, setAno] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [baseData, setBaseData] = useState<'envio' | 'periodo'>('envio')
  const [agrupar, setAgrupar] = useState('')
  const [ocultas, setOcultas] = useState<Record<string, string[]>>({})

  const f = {
    mostraBusca: true,
    mostraStatus: tipo === 'atestados' || tipo === 'atrasos',
    mostraCategoria: tipo === 'atrasos',
    mostraTurma: ['atestados', 'faltas', 'atrasos', 'matriculas'].includes(tipo),
    mostraUnidade: ['atestados', 'faltas', 'atrasos', 'turmas', 'matriculas'].includes(tipo),
    mostraProfessor: tipo === 'turmas',
    mostraPerfil: tipo === 'usuarios',
    mostraSituacao: tipo === 'usuarios',
    mostraAno: ['turmas', 'matriculas'].includes(tipo),
    mostraPeriodo: ['atestados', 'faltas', 'atrasos'].includes(tipo),
  }

  function trocarTipo(t: Tipo) {
    setTipo(t)
    setAgrupar('')
  }

  function limpar() {
    setBusca(''); setStatus(''); setCategoria(''); setTurmaId(''); setUnidadeId(''); setProfessorId('')
    setPerfil(''); setSituacao(''); setAno(''); setDe(''); setAte(''); setAgrupar('')
  }

  // ---------- aplica filtros e monta colunas/agrupadores do tipo escolhido ----------
  const rel = useMemo(() => {
    const dentroDoPeriodo = (d: string) => (!de || d >= de) && (!ate || d <= ate)

    if (tipo === 'atestados') {
      const linhas = dados.atestados.filter((r) => {
        if (busca && !contem(`${r.aluno} ${r.email}`, busca)) return false
        if (status && r.status !== status) return false
        if (turmaId && !r.turmaIds.includes(turmaId)) return false
        if (unidadeId && !r.unidadeIds.includes(unidadeId)) return false
        if (de || ate) {
          if (baseData === 'envio') return dentroDoPeriodo(r.enviadoEm.slice(0, 10))
          return (!ate || r.inicio <= ate) && (!de || r.fim >= de)
        }
        return true
      })
      return { colunas: COL_ATESTADOS as Coluna<unknown>[], grupos: GRP_ATESTADOS as Agrupador<unknown>[], linhas: linhas as unknown[], peso: (r: unknown) => (r as Atestado).dias, pesoRotulo: 'Dias' }
    }
    if (tipo === 'faltas') {
      const linhas = dados.faltas.filter((r) => {
        if (busca && !contem(`${r.aluno} ${r.email}`, busca)) return false
        if (turmaId && r.turmaId !== turmaId) return false
        if (unidadeId && r.unidadeId !== unidadeId) return false
        if ((de || ate) && !dentroDoPeriodo(r.dataFalta)) return false
        return true
      })
      return { colunas: COL_FALTAS as Coluna<unknown>[], grupos: GRP_FALTAS as Agrupador<unknown>[], linhas: linhas as unknown[], peso: null, pesoRotulo: '' }
    }
    if (tipo === 'atrasos') {
      const linhas = dados.atrasos.filter((r) => {
        if (busca && !contem(`${r.aluno} ${r.email}`, busca)) return false
        if (status && r.status !== status) return false
        if (categoria && r.categoria !== categoria) return false
        if (turmaId && !r.turmaIds.includes(turmaId)) return false
        if (unidadeId && !r.unidadeIds.includes(unidadeId)) return false
        if ((de || ate) && !dentroDoPeriodo(r.data)) return false
        return true
      })
      return { colunas: COL_ATRASOS as Coluna<unknown>[], grupos: GRP_ATRASOS as Agrupador<unknown>[], linhas: linhas as unknown[], peso: null, pesoRotulo: '' }
    }
    if (tipo === 'usuarios') {
      const linhas = dados.usuarios.filter((r) => {
        if (busca && !contem(`${r.nome} ${r.email}`, busca)) return false
        if (perfil && r.perfil !== perfil) return false
        if (situacao && String(r.ativo) !== situacao) return false
        return true
      })
      return { colunas: COL_USUARIOS as Coluna<unknown>[], grupos: GRP_USUARIOS as Agrupador<unknown>[], linhas: linhas as unknown[], peso: null, pesoRotulo: '' }
    }
    if (tipo === 'turmas') {
      const linhas = dados.turmas.filter((r) => {
        if (busca && !contem(r.nome, busca)) return false
        if (unidadeId && r.unidadeId !== unidadeId) return false
        if (professorId && r.professorId !== professorId) return false
        if (ano && String(r.ano) !== ano) return false
        return true
      })
      return { colunas: COL_TURMAS as Coluna<unknown>[], grupos: GRP_TURMAS as Agrupador<unknown>[], linhas: linhas as unknown[], peso: (r: unknown) => (r as Turma).alunos, pesoRotulo: 'Alunos' }
    }
    const linhas = dados.matriculas.filter((r) => {
      if (busca && !contem(`${r.aluno} ${r.email}`, busca)) return false
      if (turmaId && r.turmaId !== turmaId) return false
      if (unidadeId && r.unidadeId !== unidadeId) return false
      if (ano && String(r.ano) !== ano) return false
      return true
    })
    return { colunas: COL_MATRICULAS as Coluna<unknown>[], grupos: GRP_MATRICULAS as Agrupador<unknown>[], linhas: linhas as unknown[], peso: null, pesoRotulo: '' }
  }, [dados, tipo, busca, status, categoria, turmaId, unidadeId, professorId, perfil, situacao, ano, de, ate, baseData])

  const ocultasDoTipo = ocultas[tipo] ?? []
  const colunasVisiveis = rel.colunas.filter((c) => !ocultasDoTipo.includes(c.key))

  function alternarColuna(key: string) {
    setOcultas((prev) => {
      const atual = prev[tipo] ?? []
      return { ...prev, [tipo]: atual.includes(key) ? atual.filter((k) => k !== key) : [...atual, key] }
    })
  }

  // ---------- agrupamento ----------
  const grupoAtivo = rel.grupos.find((g) => g.key === agrupar)
  const tabelaGrupo = useMemo(() => {
    if (!grupoAtivo) return null
    const mapa = new Map<string, { qtd: number; soma: number }>()
    for (const r of rel.linhas) {
      for (const k of grupoAtivo.chaves(r)) {
        const atual = mapa.get(k) ?? { qtd: 0, soma: 0 }
        atual.qtd += 1
        atual.soma += rel.peso ? rel.peso(r) : 0
        mapa.set(k, atual)
      }
    }
    return [...mapa.entries()].sort((a, b) => b[1].qtd - a[1].qtd || a[0].localeCompare(b[0]))
  }, [grupoAtivo, rel])

  // ---------- resumo ----------
  const resumo: { rotulo: string; valor: number }[] = [{ rotulo: 'Registros', valor: rel.linhas.length }]
  if (tipo === 'atestados') {
    const l = rel.linhas as Atestado[]
    resumo.push(
      { rotulo: 'Pendentes', valor: l.filter((r) => r.status === 'pendente').length },
      { rotulo: 'Aprovados', valor: l.filter((r) => r.status === 'aprovado').length },
      { rotulo: 'Rejeitados', valor: l.filter((r) => r.status === 'rejeitado').length },
      { rotulo: 'Total de dias', valor: l.reduce((s, r) => s + r.dias, 0) }
    )
  } else if (tipo === 'atrasos') {
    const l = rel.linhas as Atraso[]
    resumo.push(
      { rotulo: 'Pendentes', valor: l.filter((r) => r.status === 'pendente').length },
      { rotulo: 'Aprovadas', valor: l.filter((r) => r.status === 'aprovada').length },
      { rotulo: 'Rejeitadas', valor: l.filter((r) => r.status === 'rejeitada').length },
      { rotulo: 'Alunos distintos', valor: new Set(l.map((r) => r.email)).size }
    )
  } else if (tipo === 'usuarios') {
    const l = rel.linhas as Usuario[]
    resumo.push(
      { rotulo: 'Ativos', valor: l.filter((r) => r.ativo).length },
      { rotulo: 'Desativados', valor: l.filter((r) => !r.ativo).length }
    )
  } else if (tipo === 'turmas') {
    resumo.push({ rotulo: 'Alunos matriculados', valor: (rel.linhas as Turma[]).reduce((s, r) => s + r.alunos, 0) })
  } else if (tipo === 'faltas') {
    resumo.push({ rotulo: 'Alunos distintos', valor: new Set((rel.linhas as Falta[]).map((r) => r.email)).size })
  }

  // ---------- descrição dos filtros (usada na impressão) ----------
  const nomeDe = (lst: { id: string; nome: string }[], id: string) => lst.find((x) => x.id === id)?.nome ?? ''
  const filtrosAtivos = [
    busca && `Busca: "${busca}"`,
    f.mostraStatus && status && `Status: ${rotuloStatus(status)}`,
    f.mostraCategoria && categoria && `Motivo: ${nomeDe(dados.opcoes.categorias, categoria)}`,
    f.mostraTurma && turmaId && `Turma: ${nomeDe(dados.opcoes.turmas, turmaId)}`,
    f.mostraUnidade && unidadeId && `Unidade: ${nomeDe(dados.opcoes.unidades, unidadeId)}`,
    f.mostraProfessor && professorId && `Professor: ${nomeDe(dados.opcoes.professores, professorId)}`,
    f.mostraPerfil && perfil && `Perfil: ${rotuloPerfil[perfil]}`,
    f.mostraSituacao && situacao && `Situação: ${situacao === 'true' ? 'Ativo' : 'Desativado'}`,
    f.mostraAno && ano && `Ano: ${ano}`,
    f.mostraPeriodo && (de || ate) &&
      `${tipo === 'atestados' ? (baseData === 'envio' ? 'Enviados' : 'Período') : tipo === 'atrasos' ? 'Atrasos' : 'Faltas'}: ${de ? dia(de) : '…'} a ${ate ? dia(ate) : '…'}`,
  ].filter(Boolean) as string[]

  // ---------- exportação ----------
  function exportarCSV() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const linhas = [
      colunasVisiveis.map((c) => esc(c.label)).join(';'),
      ...rel.linhas.map((r) => colunasVisiveis.map((c) => esc(c.get(r))).join(';')),
    ]
    // BOM + ";" para o Excel brasileiro abrir com acentos e colunas corretas
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* ---------------- filtros ---------------- */}
      <div className="bg-white rounded-xl shadow p-5 mb-6 print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Tipo de relatório</label>
            <select value={tipo} onChange={(e) => trocarTipo(e.target.value as Tipo)} className={inputCls}>
              {(Object.keys(TITULOS) as Tipo[]).map((t) => (
                <option key={t} value={t}>{TITULOS[t]}</option>
              ))}
            </select>
          </div>

          {f.mostraBusca && (
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-gray-600">
                {tipo === 'turmas' ? 'Nome da turma' : tipo === 'usuarios' ? 'Nome ou e-mail' : 'Nome do aluno ou e-mail'}
              </label>
              <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar..." className={inputCls} />
            </div>
          )}

          {f.mostraStatus && (
            <div>
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                {tipo === 'atrasos' ? (
                  <>
                    <option value="aprovada">Aprovada</option>
                    <option value="rejeitada">Rejeitada</option>
                  </>
                ) : (
                  <>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                  </>
                )}
              </select>
            </div>
          )}

          {f.mostraCategoria && (
            <div>
              <label className="text-xs font-medium text-gray-600">Motivo do atraso</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {dados.opcoes.categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          {f.mostraTurma && (
            <div>
              <label className="text-xs font-medium text-gray-600">Turma</label>
              <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className={inputCls}>
                <option value="">Todas</option>
                {dados.opcoes.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          )}

          {f.mostraUnidade && (
            <div>
              <label className="text-xs font-medium text-gray-600">Unidade</label>
              <select value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)} className={inputCls}>
                <option value="">Todas</option>
                {dados.opcoes.unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          )}

          {f.mostraProfessor && (
            <div>
              <label className="text-xs font-medium text-gray-600">Professor</label>
              <select value={professorId} onChange={(e) => setProfessorId(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {dados.opcoes.professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          )}

          {f.mostraPerfil && (
            <div>
              <label className="text-xs font-medium text-gray-600">Perfil</label>
              <select value={perfil} onChange={(e) => setPerfil(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          )}

          {f.mostraSituacao && (
            <div>
              <label className="text-xs font-medium text-gray-600">Situação</label>
              <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className={inputCls}>
                <option value="">Todas</option>
                <option value="true">Ativo</option>
                <option value="false">Desativado</option>
              </select>
            </div>
          )}

          {f.mostraAno && (
            <div>
              <label className="text-xs font-medium text-gray-600">Ano letivo</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {dados.opcoes.anos.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {f.mostraPeriodo && (
            <>
              {tipo === 'atestados' && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Filtrar datas por</label>
                  <select value={baseData} onChange={(e) => setBaseData(e.target.value as 'envio' | 'periodo')} className={inputCls}>
                    <option value="envio">Data de envio</option>
                    <option value="periodo">Período do atestado</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600">De</label>
                <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Até</label>
                <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600">Agrupar por</label>
            <select value={agrupar} onChange={(e) => setAgrupar(e.target.value)} className={inputCls}>
              <option value="">Sem agrupamento</option>
              {rel.grupos.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </div>
        </div>

        <details className="mt-4">
          <summary className="text-sm text-blue-700 cursor-pointer select-none">
            Escolher colunas ({colunasVisiveis.length} de {rel.colunas.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {rel.colunas.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!ocultasDoTipo.includes(c.key)} onChange={() => alternarColuna(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </details>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportarCSV} disabled={rel.linhas.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            Exportar para Excel (CSV)
          </button>
          <button onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Imprimir / salvar em PDF
          </button>
          <button onClick={limpar} className="px-4 py-2 rounded-lg text-sm text-gray-600 border hover:bg-gray-50">
            Limpar filtros
          </button>
        </div>
      </div>

      {/* ---------------- cabeçalho da impressão ---------------- */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">SENAI MT — Relatório de {TITULOS[tipo]}</h1>
        <p className="text-xs text-gray-600">
          Gerado em {formatDateTime(new Date().toISOString())}
          {filtrosAtivos.length > 0 && ` · Filtros: ${filtrosAtivos.join(' · ')}`}
        </p>
      </div>

      {/* ---------------- resumo ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {resumo.map((s) => (
          <div key={s.rotulo} className="bg-white rounded-xl shadow p-3 print:shadow-none print:border">
            <p className="text-2xl font-bold text-blue-700">{s.valor}</p>
            <p className="text-xs text-gray-500">{s.rotulo}</p>
          </div>
        ))}
      </div>

      {/* ---------------- agrupamento ---------------- */}
      {tabelaGrupo && (
        <div className="bg-white rounded-xl shadow overflow-x-auto mb-6 print:shadow-none print:border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">{grupoAtivo!.label}</th>
                <th className="text-right px-4 py-2">Quantidade</th>
                {rel.peso && <th className="text-right px-4 py-2">{rel.pesoRotulo}</th>}
              </tr>
            </thead>
            <tbody>
              {tabelaGrupo.map(([k, v]) => (
                <tr key={k} className="border-t">
                  <td className="px-4 py-2">{k}</td>
                  <td className="px-4 py-2 text-right">{v.qtd}</td>
                  {rel.peso && <td className="px-4 py-2 text-right">{v.soma}</td>}
                </tr>
              ))}
              {tabelaGrupo.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- dados ---------------- */}
      <div className="bg-white rounded-xl shadow overflow-x-auto print:shadow-none print:border">
        <table className="w-full text-sm print:text-xs">
          <thead className="bg-gray-50">
            <tr>
              {colunasVisiveis.map((c) => (
                <th key={c.key} className="text-left px-3 py-2 whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rel.linhas.map((r, i) => (
              <tr key={i} className="border-t align-top">
                {colunasVisiveis.map((c) => (
                  <td key={c.key} className="px-3 py-2">{c.get(r)}</td>
                ))}
              </tr>
            ))}
            {rel.linhas.length === 0 && (
              <tr>
                <td colSpan={Math.max(colunasVisiveis.length, 1)} className="px-4 py-8 text-center text-gray-500">
                  Nenhum registro encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
