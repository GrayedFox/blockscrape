# Blockscrape

Scrapes a blockchain for required information and export it to a CSV file.

* Fast (uses Node workers to get the job done in parallel)
* Support for adding other blockchains down the line

### Installation

***Prerequisites***

* Requires Node Carbon (v8). I'd recommend installing using [Node Version Manager][2]

* A local crypto blockchain node such as [Litecoin][3] or [Bitcoin][4]

***Instructions***

 1. clone the repo into wherever you keep these things
 2. `cd` into blockscrape root directory
 3. `npm install` to get required packages
 4. `npm link` to get that fancy symlink (ooooh shiny!)

This will clone the repo, install required packages, and create a blockscrape binary.

Now before I tell you the magic command you need to know a few things...

### Environment Variables And A Few things

To take advantage of memoization the scraper goes ***in reverse***. No matter what two blocks you pass
blockscrape will begin at the highest block and end at the lowest.

The scraper does have some persistance although it's pretty basic: blockscrape saves the last written block to a file (`last-written-block.save`) and will begin from the next block down the chain, so you can safely restart it with, say, a
cron job in case the master process dies.

The save files (you might also notice a `failed-blocks.save` appear in case a worker dies while scraping) are ignored
by Git and thus shouldn't be checked into version control.

The data dumps are saved in the (you guessed it!) dumps folder and reference the first and final (last written) blocks
in the data dump, for example `blocks-109330-109300.csv`.

* BLOCKSCRAPECACHESIZE: max transactions able to be stored in the LRU cache (defaults to `100000`)
* BLOCKSCRAPECLI: the name of the cli interface of your local blockchain, in undefined defaults to `bitcoin-cli`
* BLOCKSCRAPEFROM: the first block (inclusive) to scrape, if undefined attempt to read from `last-written-block` file
* BLOCKSCRAPETO: the final block (inclusive) to scrape, if undefined defaults to `0`
* BLOCKSCRAPELIMIT: the maximum amount of blocks to write before shutting the process down, defaults to `0`

> NOTE: The BLOCKSCRAPELIMIT defaults to 0 but will be set at runtime to the difference between BLOCKSCRAPEFROM and
BLOCKSCRAPETO so it can be safely left alone. Setting a limit is useful if, say, you want blockscrape to shutdown
after N blocks or if you want to have multiple data dumps of N blocks instead of one giant data dump

### Running Blockscrape

Now that you know what the environment variables do you could, for example, scrape block 30000 to block 10 by doing:

* `BLOCKSCRAPECLI=litecoin-cli BLOCKSCRAPEFROM=30000 BLOCKSCRAPETO=10 blockscrape`

Typing out those hefty environment variables every time would be tedious and I figure you probably don't want to sit
around staring at your screen to ensure the blockscrape is alive and well while scraping large amounts of data.

In that case consider starting (and potentially restarting) blockscrape with a script like so:

```bash
# restartBlockscrape.sh

#!/bin/bash
source $HOME/.bashrc

NODE="$(which node)"
PROCESS="$NODE /home/grayedfox/github/blockscrape/main.js"
LOGFILE="/tmp/log.out"

export BLOCKSCRAPECLI="$(which litecoin-cli)"

if pgrep -f "$PROCESS" > /dev/null; then
  echo "Blockscrape is doing it's thing - moving on..." >> $LOGFILE
else
  echo "Blockscrape not running! Starting again..." >> $LOGFILE
  echo "Process: $PROCESS" >> $LOGFILE
  echo "Node: $NODE" >> $LOGFILE
  $PROCESS >> $LOGFILE
fi
```

Now to monitor progress you could `tail -f /tmp/log.out` if using the above example and watch the blocks roll by.

You could also turn this into a cronjob using `crontab -e` (or your scheduler of choice) to execute that script every N minutes/hours/unicorns.

### Supported Blockchains

* Litecoin
* Bitcoin (in theory, need to test)

### Coming Soon

* Ability to specify which attributes you want (currently dumps txid, blockheight, time, tx amount, and fee)
* Ability to scrape remote nodes (such as [Blockcypher][5] or [Blockchain.info][6])
* Benchmarks
* Tests

### Contributing

Please follow the [GitFlow][1] branching model. Feature branches will require code reviews
and branches merging into develop should be squashed. I have a linting style I like and I'd pefer you stick to it -
Travis will fail PR's that don't conform (sorry!). Captain's orders. All else is up for discussion!

Oh and feel free to report bugs, feedback, and the like - it's all much appreciated.

[1]: http://nvie.com/posts/a-successful-git-branching-model/
[2]: https://github.com/creationix/nvm
[3]: https://litecoin.org
[4]: https://bitcoin.org/en/
[5]: https://live.blockcypher.com
[6]: https://blockchain.info/api
