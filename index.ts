export type IEvent = string

export interface EventHandler {
  id: string;
  event: IEvent;
  handle(context: unknown, event: IEvent): void;
  group: string | undefined;
}

let runningId = 1
let handlers: EventHandler[] = []

const getNextId = (): string => {
  return `custom-event-${runningId++}`
}

const subscribe = <T>(
  event: IEvent,
  callback: EventHandler['handle'],
  group: string | undefined = undefined
): string => {
  const id = getNextId()

  handlers.push({
    id,
    event,
    handle: callback,
    group,
  })

  return id
}

const unsubscribe = (id: string): void => {
  handlers = handlers.filter(handler => handler.id !== id)
}

const unsubscribeGroup = (group: string): void => {
  handlers = handlers.filter(handler => handler.group !== group)
}

const runHandlers = (matching: EventHandler[], event: IEvent, context: unknown): void => {
  let failed = false
  let firstError: unknown

  matching.forEach(handler => {
    try {
      handler.handle(context, event)
    } catch (error) {
      if (! failed) {
        failed = true
        firstError = error
      }
    }
  })

  if (failed) {
    throw firstError
  }
}

const dispatch = (event: IEvent, context?: unknown): void => {
  runHandlers(handlers.filter(handler => handler.event === event), event, context)
}

const dispatchFor = (event: IEvent, id: string, context?: unknown): void => {
  runHandlers(handlers.filter(handler => handler.event === event && handler.id === id), event, context)
}

export {
  subscribe,
  unsubscribe,
  unsubscribeGroup,
  dispatchFor,
  dispatch,
}
