import { spawnStateless } from ".";
import { dispatch, query } from "./functions";
import { start, stop } from "./index";
import { Dispatchable, LocalActorRef, LocalActorSystemRef } from "./references";

describe("query", function () {
  let system: LocalActorSystemRef;
  beforeEach(() => {
    system = start();
  });
  afterEach(() => stop(system));

  it("should accept only supported messages", function () {
    let actor = spawnStateless(
      system,
      (msg: {
        readonly sender: Dispatchable<string | number>;
        readonly valueToDouble: string | number;
      }) => {
        const doubledValued =
          typeof msg.valueToDouble === "string"
            ? msg.valueToDouble + msg.valueToDouble
            : msg.valueToDouble + msg.valueToDouble;
        dispatch(msg.sender, doubledValued);
      }
    );

    query(actor, (x) => ({ sender: x, valueToDouble: 10 }), 30);
    query(actor, (x) => ({ sender: x, valueToDouble: "ten" }), 30);
    // @ts-expect-error
    query(actor, (x) => ({ sender: x, valueToDouble: null }), 30);
  });

  it("should accept only known supported messages even with no upper bound on supported message types", function () {
    let scopeThatUsesSmallerActor = <
      TActor extends LocalActorRef<{
        sender: Dispatchable<string | number>;
        valueToDouble: string | number;
      }>
    >(
      actor: TActor
    ) => {
      query(actor, (x) => ({ sender: x, valueToDouble: 10 }), 30);
      query(actor, (x) => ({ sender: x, valueToDouble: "ten" }), 30);
      // @ts-expect-error
      query(actor, (x) => ({ sender: x, valueToDouble: null }), 30);
    };

    let actor = spawnStateless(
      system,
      (msg: {
        readonly sender: Dispatchable<string | number>;
        readonly valueToDouble: string | number;
      }) => {
        const doubledValued =
          typeof msg.valueToDouble === "string"
            ? msg.valueToDouble + msg.valueToDouble
            : msg.valueToDouble + msg.valueToDouble;
        dispatch(msg.sender, doubledValued);
      }
    );
    scopeThatUsesSmallerActor(actor);
  });
});

describe("dispatch", function () {
  let system: LocalActorSystemRef;
  beforeEach(() => {
    system = start();
  });
  afterEach(() => stop(system));

  it("should accept only supported messages", function () {
    let actor = spawnStateless(system, (_msg: string | number) => {});

    dispatch(actor, "text");
    dispatch(actor, 1000);
    // @ts-expect-error
    dispatch(actor, null);
  });

  it("should accept only known supported messages even with no upper bound on supported message types", function () {
    let scopeThatUsesSmallerActor = <
      TActor extends LocalActorRef<string | number>
    >(
      actor: TActor
    ) => {
      dispatch(actor, "text");
      dispatch(actor, 1000);
      // @ts-expect-error
      dispatch(actor, null);
    };

    let biggerActor: LocalActorRef<string | number | symbol> = spawnStateless(
      system,
      (_msg: string | number | symbol) => {}
    );
    scopeThatUsesSmallerActor(biggerActor);
  });
});
