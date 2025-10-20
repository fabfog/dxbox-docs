# PubSubMixin

Mixin to apply the `PubSub` logics to any class.

---

## Overview

`PubSubMixin` is used to make any class reactive, adding `PubSub` capabilities to it via delegation.

The reason this mixin exists is because JavaScript doesn't support multiple inheritance. So it's impossible to write something like this:
```ts
import { PubSub } from '@dxbox/use-less-react/classes';
import { Counter as BaseCounter } from 'third-party-lib';

class Counter extends PubSub, BaseCounter {
  ...
}
```

With `PubSubMixin` we can simply obtain the same result by writing:
```ts
import { PubSubMixin } from '@dxbox/use-less-react/classes';
import { Counter as BaseCounter } from 'third-party-lib';

class Counter extends PubSubMixin(BaseCounter) {
  ...
}
```

Now, an instance of `Counter` will have all the methods and attributes of `BaseCounter`, but it will also have a `subscribe`, a `notify` and a `onNotify` method. 

In order to be notified when some attributes change, we must customize the behavior of `Counter` by overriding its methods:

```ts
import { PubSubMixin } from '@dxbox/use-less-react/classes';
import { Counter as BaseCounter } from 'third-party-lib';

class Counter extends PubSubMixin(BaseCounter) {
  increment() {
    super.increment();
    this.notify("count"); // using this.notify
  }
}
```

or, equivalently, using the `Notifies` decorator:

```ts
import { PubSubMixin, Notifies } from '@dxbox/use-less-react/classes';
import { Counter as BaseCounter } from 'third-party-lib';

class Counter extends PubSubMixin(BaseCounter) {
  @Notifies("count")
  increment() {
    super.increment();
  }
}
```

Of course, this is possible only if we know which attributes are notified by which methods from the base class.

## Connect the class to a React component via the useReactiveInstance hook

You can use your reactive version of `Counter` with `useReactiveInstance`:

```ts
import { useReactiveInstance } from '@dxbox/use-less-react/hooks';

function CounterComponent({ counter }: { counter: Counter }) {
  const { state: { count } } = useReactiveInstance(counter, ['count']);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
    </div>
  );
}
```

import PubSubMixinPlayground from '../../playgrounds/pubsub-mixin';

<PubSubMixinPlayground />


## See Also

- [`PubSub`](/docs/use-less-react/api/classes/pubsub)
<!-- TODO -->
- [`Notifies`](/docs/use-less-react/api/classes/notifies) 
