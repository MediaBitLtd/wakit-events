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
  return `custom-event-${runningId ++}`
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

const dispatch = (event: IEvent, context?: unknown): void => {
  handlers
    .filter(handler => handler.event === event)
    .forEach(handler => handler.handle(context, event))
}

const dispatchFor = (event: IEvent, id: string, context?: unknown): void => {
  handlers
    .filter(handler => handler.event === event && handler.id === id)
    .forEach(handler => handler.handle(context, event))
}

export {
  subscribe,
  unsubscribe,
  unsubscribeGroup,
  dispatchFor,
  dispatch,
}
