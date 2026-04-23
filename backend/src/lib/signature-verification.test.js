import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as StellarSdk from 'stellar-sdk'

// vi.hoisted makes mockCall available inside the vi.mock factory
const { mockTxCall, mockTransaction } = vi.hoisted(() => ({
    mockTxCall: vi.fn(),
    mockTransaction: vi.fn(),
}))

vi.mock('stellar-sdk', async (importOriginal) => {
    const actual = await importOriginal()

    const MockServer = vi.fn(() => ({
        transactions: () => ({
            transaction: (hash) => {
                mockTransaction(hash)
                return {
                    call: mockTxCall
                }
            }
        })
    }))

    const MockTransaction = vi.fn((envelopeXdr, passphrase) => ({
        signatures: envelopeXdr === 'invalid' ? [] : [{ signature: 'valid-sig' }]
    }))

    return {
        ...actual,
        Horizon: { Server: MockServer },
        Transaction: MockTransaction,
        Networks: {
            PUBLIC: 'Public Global Stellar Network ; October 2014',
            TESTNET: 'Test net Stellar Network ; September 2015'
        }
    }
})

import { verifyTransactionSignature } from './stellar.js'

describe('verifyTransactionSignature', () => {
    beforeEach(() => {
        mockTxCall.mockReset()
        mockTransaction.mockReset()
    })

    it('returns true when transaction has signatures', async () => {
        mockTxCall.mockResolvedValue({
            envelope_xdr: 'valid-envelope-with-signatures'
        })

        const result = await verifyTransactionSignature('tx-123')
        expect(result).toBe(true)
        expect(mockTransaction).toHaveBeenCalledWith('tx-123')
    })

    it('returns false when transaction has no signatures', async () => {
        mockTxCall.mockResolvedValue({
            envelope_xdr: 'invalid'
        })

        const result = await verifyTransactionSignature('tx-empty')
        expect(result).toBe(false)
        expect(mockTransaction).toHaveBeenCalledWith('tx-empty')
    })

    it('returns false when transaction fetch fails', async () => {
        mockTxCall.mockRejectedValue(new Error('Horizon error'))

        const result = await verifyTransactionSignature('tx-fail')
        expect(result).toBe(false)
        expect(mockTransaction).toHaveBeenCalledWith('tx-fail')
    })
})
