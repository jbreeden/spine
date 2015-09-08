# spine
Backbone &amp; jQuery debugging extension for Chrome DevTools.

## Features

Spine provides event tracing and correlation functions for jQuery and Backbone. It can also help you find the view
responsible for a particular DOM element.

Works with globally defined Backbone & AMD modules defined with `define`.

## Install from source

Using Google Chrome:

- Download the project archive and extract it somewhere.
- Click on Tools -> Settings -> Extensions
- Select "Enable developer mode" in the upper right of the window.
- Click on "Load unpacked extension".
- Select the extracted folder.
- Enjoy!

(Thanks to Manuel Dell'Elce, the author of [Backbone-Debugger](https://github.com/Maluen/Backbone-Debugger) & these installation instructions.)

_Note: Spine will inject itself into every page until you disable the extension from the settings page._

### Get View from DOM Elements

All DOM elements are monkey-patched with a `view` property, which will return the view object that rendered
the element (or its parent, or grandparent, etc). That means you can just select the element in the "Elements" tab,
and run $0.view in the console.

### Inspect Objects

Spine is able to detect objects created from backbone classes. Use these properties to inspect all of the views, models, collections, and routers of your application.

- `spine.views`
- `spine.domViews` (Only views that currently have DOM elements in the document)
- `spine.models`
- `spine.collections`
- `spine.routers`

![view objects](https://raw.github.com/jbreeden/spine/master/screenshots/view_objects.png)

### List Views

While `spine.views` will return an array of all views, `spine.listViews()` will pretty-print them in the console for faster, more useful inspection.

![list views](https://raw.github.com/jbreeden/spine/master/screenshots/list_views.png)

### Trace Events

Use `spine.traceEvents()` to have all Backbone events from all objects logged. If you're only interested in events
from certain types of objects, just pass in a collection. Ex: `spine.traceEvents(spine.domViews)`

![trace events](https://raw.github.com/jbreeden/spine/master/screenshots/trace_events.png)

### Correlate Events

A typical Backbone app will trigger tons of events. Making sense of this information can be tricky. To help, spine
provides some basic event correlation in the form of `spine.traceActions()`. This function will group consecutive
events together into actions, so long as each event is triggered within a tolerable delay (200ms by default) of the 
previous one.

Instead of hundreds of events, you will be shown just a few actions which you can dive into and inspect.

_Note: To set a custom tolerance, just pass a number of milliseconds, as in `spine.traceActions(1000)` for one second._

![correlate events](https://raw.github.com/jbreeden/spine/master/screenshots/correlate_events.png)

### Inspect Actions

Actions are shown in a group with a label like `spine.actions[0]`. This refers to an actual array, where you can
retrieve your actions and all associated events. You can then filter the events to get a more focused view of the events
you're concered with.

For convenience, spine provides the `eventsOfType` function on actions. This function takes a string or regular expression
and displays all events in the action that match.

![inspect actions](https://raw.github.com/jbreeden/spine/master/screenshots/inspect_actions.png)

### Tracing on Page Load

Having to call `spine.traceActions()` to start tracing means you can't debug your page until after it has finished
loading. To work around this, you can add a query string to your url of the form `spine.SOME_METHOD`. Note that you do not need to place parenthesis after the method name.

This will work with any method defined on spine. So, to trace actions on page load, you would use `http://myapp.com/path/to/page?spine.traceActions`.

### Trace Ajax

I did say this was for jQuery too, right? To trace ajax events, you can use `spine.traceActions()`, which includes
all ajax events. Alternatively, you can use `spine.traceAjax()`. One advantage of this approach is that you get full
stack traces for each event. This is true for all `traceSomething` functions besides `traceActions` (having to store
the stacktrace until the action is done before printing it complicates things...)

By default, all ajax events are traced (start, send, success, error, complete, stop). To trace a subset of these
events, just supply the short name of the event to the trace function. Ex: `spine.traceAjax('send', 'complete')` will trace only send & complete events.
