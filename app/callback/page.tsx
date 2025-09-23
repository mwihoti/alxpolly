'use client'
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthCallbackPage() {
    const router = useRouter()


    useEffect(() => {
        router.replace('/')
    }, [router])

    return <p> Signing you in... </p>
}