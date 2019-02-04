
# Performance

This repository comes with a naive performance test framework to compare a couple of implementations of the core functionality.

To run the performance test, open the terminal and type:

```sh
$ yarn perf
```

## scanDirectory

Scanning items on the filesystem is the most frequently performed action of filesystem watchers.

#### Experiment (2019-02-04)

- shallow scan:
  - 1-2 ms for 400 items
- deep scan:
  - 850-1000 ms 14000 items
- shallow watch:
  - 250-280 ms for 400 items
- deep watch:
  - 6700-6800 ms for 14000 items

**Conclusion**:

Reading the list of files and directories via `fs.readdirSync`  is about **5-10x faster** than using chokidar.
