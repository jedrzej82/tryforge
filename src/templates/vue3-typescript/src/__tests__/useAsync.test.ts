import { describe, it, expect, vi } from 'vitest'
import { useAsync } from '@/composables/useAsync'

describe('useAsync', () => {
  it('should initialize with correct default values', () => {
    const asyncFn = vi.fn().mockResolvedValue('test')
    const { data, loading, error } = useAsync(asyncFn)

    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should execute async function and update data', async () => {
    const mockData = { id: 1, name: 'Test' }
    const asyncFn = vi.fn().mockResolvedValue(mockData)
    const { data, loading, execute } = useAsync(asyncFn)

    const result = await execute()

    expect(asyncFn).toHaveBeenCalled()
    expect(data.value).toEqual(mockData)
    expect(result).toEqual(mockData)
    expect(loading.value).toBe(false)
  })

  it('should handle errors correctly', async () => {
    const errorMessage = 'Test error'
    const asyncFn = vi.fn().mockRejectedValue(new Error(errorMessage))
    const { data, error, loading, execute } = useAsync(asyncFn)

    const result = await execute()

    expect(data.value).toBeNull()
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe(errorMessage)
    expect(result).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('should set loading to true during execution', async () => {
    let resolvePromise: (value: string) => void
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve
    })
    const asyncFn = vi.fn().mockReturnValue(promise)
    const { loading, execute } = useAsync(asyncFn)

    const executePromise = execute()
    expect(loading.value).toBe(true)

    resolvePromise!('done')
    await executePromise
    expect(loading.value).toBe(false)
  })

  it('should execute immediately when immediate is true', () => {
    const asyncFn = vi.fn().mockResolvedValue('test')
    useAsync(asyncFn, true)

    expect(asyncFn).toHaveBeenCalled()
  })

  it('should not execute immediately when immediate is false', () => {
    const asyncFn = vi.fn().mockResolvedValue('test')
    useAsync(asyncFn, false)

    expect(asyncFn).not.toHaveBeenCalled()
  })

  it('should reset state correctly', async () => {
    const mockData = { id: 1, name: 'Test' }
    const asyncFn = vi.fn().mockResolvedValue(mockData)
    const { data, error, loading, execute, reset } = useAsync(asyncFn)

    await execute()
    expect(data.value).toEqual(mockData)

    reset()

    expect(data.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should pass arguments to async function', async () => {
    const asyncFn = vi.fn().mockResolvedValue('test')
    const { execute } = useAsync(asyncFn)

    await execute('arg1', 'arg2', 123)

    expect(asyncFn).toHaveBeenCalledWith('arg1', 'arg2', 123)
  })
})
