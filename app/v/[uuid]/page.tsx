'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function VideoPage() {
  const [videoData, setVideoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const uuid = params.uuid as string

  useEffect(() => {
    if (uuid) {
      fetchVideoData(uuid)
    }
  }, [uuid])

  async function fetchVideoData(videoUuid: string) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE}/videos/${videoUuid}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setVideoData(data)
    } catch (error) {
      console.error('Error fetching video data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!videoData) return <div>Video not found</div>

  return (
    <div>
      <h1>Video Information</h1>
      <pre>{JSON.stringify(videoData, null, 2)}</pre>
    </div>
  )
}