'use client'

import { useState } from 'react'
import { Upload, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { AssetRequest, AssetRequestStatus } from '@/types'

interface AssetRequestCardProps {
  asset: AssetRequest
  projectId: string
  isAdmin: boolean
}

const STATUS_CONFIG: Record<AssetRequestStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  submitted: { label: 'Submitted', icon: Upload, color: 'text-blue-600 bg-blue-50' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50' },
}

export function AssetRequestCard({ asset, projectId, isAdmin }: AssetRequestCardProps) {
  const supabase = createClient()
  const [status, setStatus] = useState<AssetRequestStatus>(asset.status)
  const [uploading, setUploading] = useState(false)

  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf',
      'application/zip', 'application/x-zip-compressed']
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      toast.error('File type not allowed. Please upload images, PDFs, or ZIP files.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.')
      return
    }

    setUploading(true)

    const path = `${projectId}/${asset.id}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(path, file)

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(path)

    // Create file record
    await supabase.from('uploaded_files').insert({
      project_id: projectId,
      asset_request_id: asset.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: path,
      public_url: publicUrl,
      organization_id: asset.organization_id,
    })

    // Update asset request status
    const { error: statusError } = await supabase
      .from('asset_requests')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', asset.id)

    if (statusError) {
      toast.error('Failed to update asset status')
    } else {
      setStatus('submitted')
      toast.success('File uploaded successfully!')
    }

    setUploading(false)
  }

  async function handleApprove() {
    const { error } = await supabase
      .from('asset_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', asset.id)

    if (!error) {
      setStatus('approved')
      toast.success('Asset approved')
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900">{asset.title}</p>
            {asset.is_required && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Required</span>
            )}
          </div>
          {asset.description && (
            <p className="text-xs text-slate-500 mt-0.5">{asset.description}</p>
          )}
        </div>

        <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        {status === 'pending' && (
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors',
              uploading && 'opacity-50 cursor-not-allowed'
            )}>
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </span>
          </label>
        )}

        {status === 'submitted' && isAdmin && (
          <button
            onClick={handleApprove}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </button>
        )}
      </div>
    </div>
  )
}
