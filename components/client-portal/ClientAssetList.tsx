'use client'

import { useState } from 'react'
import { Upload, CheckCircle2, Clock, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'
import type { AssetRequest, AssetRequestStatus } from '@/types'

interface ClientAssetListProps {
  assets: AssetRequest[]
  projectId: string
  organizationId: string
}

export function ClientAssetList({ assets, projectId, organizationId }: ClientAssetListProps) {
  const supabase = createClient()
  const [statuses, setStatuses] = useState<Record<string, AssetRequestStatus>>(
    Object.fromEntries(assets.map((a) => [a.id, a.status]))
  )
  const [uploading, setUploading] = useState<string | null>(null)

  async function handleUpload(assetId: string, file: File) {
    // Validate
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File too large. Max size is ${formatFileSize(maxSize)}`)
      return
    }

    setUploading(assetId)

    const path = `${projectId}/${assetId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(path, file)

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(path)

    // Record file
    await supabase.from('uploaded_files').insert({
      project_id: projectId,
      asset_request_id: assetId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: path,
      public_url: publicUrl,
      organization_id: organizationId,
    })

    // Update asset request
    const { error } = await supabase
      .from('asset_requests')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', assetId)

    if (!error) {
      setStatuses((prev) => ({ ...prev, [assetId]: 'submitted' }))
      toast.success('File uploaded! Your team has been notified.')
    } else {
      toast.error('Upload recorded but status update failed')
    }

    setUploading(null)
  }

  const sortedAssets = [...assets].sort((a, b) => {
    // Required first, then by created date
    if (a.is_required && !b.is_required) return -1
    if (!a.is_required && b.is_required) return 1
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50 overflow-hidden">
      {sortedAssets.map((asset) => {
        const status = statuses[asset.id]
        const isUploading = uploading === asset.id

        return (
          <div key={asset.id} className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-slate-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-900">{asset.title}</p>
                {asset.is_required && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                    Required
                  </span>
                )}
              </div>
              {asset.description && (
                <p className="text-xs text-slate-500 mt-0.5">{asset.description}</p>
              )}
            </div>

            <div className="flex-shrink-0">
              {status === 'approved' ? (
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Approved
                </div>
              ) : status === 'submitted' ? (
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <Clock className="w-4 h-4" />
                  Under review
                </div>
              ) : (
                <label className={cn('cursor-pointer', isUploading && 'opacity-50 cursor-not-allowed')}>
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(asset.id, file)
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </span>
                </label>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
