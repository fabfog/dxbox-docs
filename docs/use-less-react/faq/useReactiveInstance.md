# Best Practice for useReactiveInstance

**Question:** *"Are there any best practices regarding useReactiveInstance? Is it better to call it in one single place or should I use it for each reactive piece of data I need in the View?"*

## Short Answer

It's quite the same in terms of performance, so generally speaking it's better to call it only one time, in order to keep the component readable.

## Detailed Answer

The primary function of `useReactiveInstance` is to establish a subscription connection between the provided reactive data container (e.g., a View Model) and the React component lifecycle, ensuring the component re-renders when the container's state changes.

While the performance difference between calling the hook once or multiple times is often negligible, readability and architectural cohesion strongly favor calling it in a single, central location.

The only theoretical exception could be if the component needs to get derived data that is computed everytime some method of the ViewModel is called. For example:

```typescript
const {
  state: {
    someDerivedPropReturnedByAGetter,
    someOtherProp,
  }
} = useReactiveInstance(
  () => new ViewModel(),
  (vm) => {
    someDerivedPropReturnedByAGetter: vm.someDerivedPropReturnedByAGetter,
    someOtherProp: vm.someOtherProp,
  },
  [
    "someDerivedPropReturnedByAGetter",
    "someOtherProp",
  ]
)
```

In this case you may want to avoid getting `someDerivedPropReturnedByAGetter` whenever `someOtherProp` changes. 

Yes, but...

But please take this into consideration: the View shouldn't be aware of its ViewModel's performance issues. So if this happens, it's a design issue. You should memoize `someDerivedPropReturnedByAGetter`, for example, or change the implementation. The View should not be concerned with the ViewModel's internal implementation details.

So again, you can safely use a single call to `useReactiveInstance` into your View. Then design your ViewModel properly! 🙃
