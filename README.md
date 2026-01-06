<h1 align="center">Wakit Events</h1>
<h3 align="center">The event system for wakit</h3>

---

## Installation

`npm i @wakit/events`

## Usage

##### Events

Creating events is super simple, they are just unique strings. You can use TypeScript to keep things tidy.

```typescript
import type { IEvent } from '@wakit/events'

const MY_AWESOME_EVENT: IEvent = 'my_awesome_event'
```

##### Groups

You can group your event handlers to unsubscribe an entire group. It also helps if you want to catch the same event on different occasions

```typescript
import type { IEvent } from '@wakit/events'
import { dispatch, subscribe, unsubscribe } from '@wakit/events'

const DISPATCH_REDIRECT: IEvent = 'request_redirect'

subscribe(DISPATCH_REDIRECT, () => {
  window.location.href = '/redirected'
}, 'router')

onbeforeunload(() => unsubscribeGroup('router'))
```

## Example

This is a good example of how to use the various functions.

##### TypeScript

```typescript
import type { IEvent } from '@wakit/events'
import { dispatch, subscribe, unsubscribe } from '@wakit/events'

const MY_AWESOME_EVENT: IEvent = 'my_awesome_event'

const eventId = subscribe(MY_AWESOME_EVENT, (context: string, event: IEvent) => {
  console.log(`Received event [${event}] with the message: ${context}`)
})

document.getElementById('my-button').onclick = () => {
  dispatch(MY_AWESOME_EVENT)
}

onbeforeunload(() => unsubscribe(eventId))
```

##### JavaScript

```javascript
import { dispatch, subscribe, unsubscribe } from '@wakit/events'

const MY_AWESOME_EVENT = 'my_awesome_event'

const eventId = subscribe(MY_AWESOME_EVENT, (context, event) => {
  console.log(`Received event [${event}] with the message: ${context}`)
})

document.getElementById('my-button').onclick = () => {
  dispatch(MY_AWESOME_EVENT)
}

onbeforeunload(() => unsubscribe(eventId))
```
