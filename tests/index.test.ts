import { beforeEach, describe, expect, it, vi } from 'vitest'

type Events = typeof import('../index')

const EVENT_A = 'event_a'
const EVENT_B = 'event_b'

let events: Events

// Handlers live in module state, so reload the module for each test
beforeEach(async () => {
  vi.resetModules()
  events = await import('../index')
})

describe('subscribe', () => {
  it('returns sequential unique ids', () => {
    const first = events.subscribe(EVENT_A, () => {})
    const second = events.subscribe(EVENT_A, () => {})

    expect(first).toBe('custom-event-1')
    expect(second).toBe('custom-event-2')
  })

  it('does not call the handler on subscribe', () => {
    const handler = vi.fn()

    events.subscribe(EVENT_A, handler)

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('dispatch', () => {
  it('calls the handler with context and event', () => {
    const handler = vi.fn()
    const context = { message: 'hello' }

    events.subscribe(EVENT_A, handler)
    events.dispatch(EVENT_A, context)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(context, EVENT_A)
  })

  it('passes undefined context when none given', () => {
    const handler = vi.fn()

    events.subscribe(EVENT_A, handler)
    events.dispatch(EVENT_A)

    expect(handler).toHaveBeenCalledWith(undefined, EVENT_A)
  })

  it('only calls handlers for the dispatched event', () => {
    const handlerA = vi.fn()
    const handlerB = vi.fn()

    events.subscribe(EVENT_A, handlerA)
    events.subscribe(EVENT_B, handlerB)
    events.dispatch(EVENT_A)

    expect(handlerA).toHaveBeenCalledOnce()
    expect(handlerB).not.toHaveBeenCalled()
  })

  it('calls all handlers in subscription order', () => {
    const calls: string[] = []

    events.subscribe(EVENT_A, () => calls.push('first'))
    events.subscribe(EVENT_A, () => calls.push('second'))
    events.subscribe(EVENT_A, () => calls.push('third'))
    events.dispatch(EVENT_A)

    expect(calls).toEqual(['first', 'second', 'third'])
  })

  it('calls the handler on every dispatch', () => {
    const handler = vi.fn()

    events.subscribe(EVENT_A, handler)
    events.dispatch(EVENT_A)
    events.dispatch(EVENT_A)

    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('does nothing when there are no handlers', () => {
    expect(() => events.dispatch(EVENT_A)).not.toThrow()
  })

  it('calls remaining handlers when one throws, then rethrows its error', () => {
    const error = new Error('boom')
    const before = vi.fn()
    const after = vi.fn()

    events.subscribe(EVENT_A, before)
    events.subscribe(EVENT_A, () => {
      throw error
    })
    events.subscribe(EVENT_A, after)

    expect(() => events.dispatch(EVENT_A)).toThrow(error)
    expect(before).toHaveBeenCalledOnce()
    expect(after).toHaveBeenCalledOnce()
  })

  it('rethrows the first error when several handlers throw', () => {
    const first = new Error('first')
    const second = new Error('second')
    const last = vi.fn()

    events.subscribe(EVENT_A, () => {
      throw first
    })
    events.subscribe(EVENT_A, () => {
      throw second
    })
    events.subscribe(EVENT_A, last)

    expect(() => events.dispatch(EVENT_A)).toThrow(first)
    expect(last).toHaveBeenCalledOnce()
  })

  it('rethrows non-Error values thrown by handlers', () => {
    events.subscribe(EVENT_A, () => {
      throw undefined
    })

    expect(() => events.dispatch(EVENT_A)).toThrow()
  })

  it('still calls remaining handlers when one unsubscribes during dispatch', () => {
    const second = vi.fn()

    const firstId = events.subscribe(EVENT_A, () => events.unsubscribe(firstId))
    events.subscribe(EVENT_A, second)
    events.dispatch(EVENT_A)

    expect(second).toHaveBeenCalledOnce()
  })

  it('does not call handlers subscribed during the same dispatch', () => {
    const late = vi.fn()

    events.subscribe(EVENT_A, () => {
      events.subscribe(EVENT_A, late)
    })
    events.dispatch(EVENT_A)

    expect(late).not.toHaveBeenCalled()
  })
})

describe('dispatchFor', () => {
  it('only calls the handler with the given id', () => {
    const target = vi.fn()
    const other = vi.fn()
    const context = 42

    const id = events.subscribe(EVENT_A, target)
    events.subscribe(EVENT_A, other)
    events.dispatchFor(EVENT_A, id, context)

    expect(target).toHaveBeenCalledOnce()
    expect(target).toHaveBeenCalledWith(context, EVENT_A)
    expect(other).not.toHaveBeenCalled()
  })

  it('does not call the handler when the event does not match', () => {
    const handler = vi.fn()

    const id = events.subscribe(EVENT_A, handler)
    events.dispatchFor(EVENT_B, id)

    expect(handler).not.toHaveBeenCalled()
  })

  it('rethrows the handler error', () => {
    const error = new Error('boom')

    const id = events.subscribe(EVENT_A, () => {
      throw error
    })

    expect(() => events.dispatchFor(EVENT_A, id)).toThrow(error)
  })

  it('does nothing for an unknown id', () => {
    const handler = vi.fn()

    events.subscribe(EVENT_A, handler)
    events.dispatchFor(EVENT_A, 'unknown-id')

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('unsubscribe', () => {
  it('stops the handler from being called', () => {
    const handler = vi.fn()

    const id = events.subscribe(EVENT_A, handler)
    events.unsubscribe(id)
    events.dispatch(EVENT_A)

    expect(handler).not.toHaveBeenCalled()
  })

  it('leaves other handlers subscribed', () => {
    const removed = vi.fn()
    const kept = vi.fn()

    const id = events.subscribe(EVENT_A, removed)
    events.subscribe(EVENT_A, kept)
    events.unsubscribe(id)
    events.dispatch(EVENT_A)

    expect(removed).not.toHaveBeenCalled()
    expect(kept).toHaveBeenCalledOnce()
  })

  it('ignores unknown ids', () => {
    const handler = vi.fn()

    events.subscribe(EVENT_A, handler)
    events.unsubscribe('unknown-id')
    events.dispatch(EVENT_A)

    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('unsubscribeGroup', () => {
  it('removes every handler in the group across events', () => {
    const handlerA = vi.fn()
    const handlerB = vi.fn()

    events.subscribe(EVENT_A, handlerA, 'router')
    events.subscribe(EVENT_B, handlerB, 'router')
    events.unsubscribeGroup('router')
    events.dispatch(EVENT_A)
    events.dispatch(EVENT_B)

    expect(handlerA).not.toHaveBeenCalled()
    expect(handlerB).not.toHaveBeenCalled()
  })

  it('leaves other groups and ungrouped handlers subscribed', () => {
    const grouped = vi.fn()
    const otherGroup = vi.fn()
    const ungrouped = vi.fn()

    events.subscribe(EVENT_A, grouped, 'router')
    events.subscribe(EVENT_A, otherGroup, 'modal')
    events.subscribe(EVENT_A, ungrouped)
    events.unsubscribeGroup('router')
    events.dispatch(EVENT_A)

    expect(grouped).not.toHaveBeenCalled()
    expect(otherGroup).toHaveBeenCalledOnce()
    expect(ungrouped).toHaveBeenCalledOnce()
  })
})
