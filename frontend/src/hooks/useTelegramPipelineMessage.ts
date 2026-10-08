import { useMemo } from 'react'

interface PipelineDetail {
  sl_no: number
  ir_name: string
  prospect_name: string
  expected_uvs: number
  remarks: string
}

interface PipelineData {
  sureshot: PipelineDetail[]
  strong: PipelineDetail[]
  tentative: PipelineDetail[]
}

export const useTelegramPipelineMessage = (pipelineData: PipelineData | null): string => {
  return useMemo(() => {
    if (!pipelineData) {
      return ''
    }

    const lines: string[] = []

    lines.push('💎🧿 PIPELINES UPDATE 🧿💎')

    if (pipelineData.sureshot.length > 0) {
      const totalUV = pipelineData.sureshot.reduce((sum, d) => sum + d.expected_uvs, 0)
      lines.push('')
      lines.push(`𝐒𝐔𝐑𝐄𝐒𝐇𝐎𝐓 → ${totalUV.toFixed(2)} 𝐔𝐕𝐬`)
      pipelineData.sureshot.forEach((detail, idx) => {
        lines.push(`${idx + 1}. ${detail.ir_name} → ${detail.prospect_name} → ${detail.expected_uvs} UVs${detail.remarks ? ' → ' + detail.remarks : ''}`)
      })
    }

    if (pipelineData.strong.length > 0) {
      const totalUV = pipelineData.strong.reduce((sum, d) => sum + d.expected_uvs, 0)
      lines.push('')
      lines.push(`𝐒𝐓𝐑𝐎𝐍𝐆 → ${totalUV.toFixed(2)} 𝐔𝐕𝐬`)
      pipelineData.strong.forEach((detail, idx) => {
        lines.push(`${idx + 1}. ${detail.ir_name} → ${detail.prospect_name} → ${detail.expected_uvs} UVs${detail.remarks ? ' → ' + detail.remarks : ''}`)
      })
    }

    if (pipelineData.tentative.length > 0) {
      const totalUV = pipelineData.tentative.reduce((sum, d) => sum + d.expected_uvs, 0)
      lines.push('')
      lines.push(`𝐓𝐄𝐍𝐓𝐀𝐓𝐈𝐕𝐄 → ${totalUV.toFixed(2)} 𝐔𝐕𝐬`)
      pipelineData.tentative.forEach((detail, idx) => {
        lines.push(`${idx + 1}. ${detail.ir_name} → ${detail.prospect_name} → ${detail.expected_uvs} UVs${detail.remarks ? ' → ' + detail.remarks : ''}`)
      })
    }

    const totalPipeline = [
      ...pipelineData.sureshot,
      ...pipelineData.strong,
      ...pipelineData.tentative
    ].reduce((sum, d) => sum + d.expected_uvs, 0)

    lines.push('')
    lines.push(`𝐓𝐎𝐓𝐀𝐋 𝐏𝐈𝐏𝐄𝐋𝐈𝐍𝐄 → ${totalPipeline.toFixed(2)} 𝐔𝐕𝐬`)

    return lines.join('\n').trim()
  }, [pipelineData])
}
