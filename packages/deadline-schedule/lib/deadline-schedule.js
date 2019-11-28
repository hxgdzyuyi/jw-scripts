'use strict';

module.exports = deadlineSchedule;

const minimist = require('minimist')
const fs = require('fs')
const argv = minimist(process.argv.slice(2), { string: '_' })
const parse = require('csv-parse/lib/sync')
const makeRequest = require("./mods/throttledRequest.js")
const _ = require('lodash')
const moment = require('moment')

async function createBoard({ name }, {key, token}) {
  const options = {
    method: 'POST',
    url: 'https://api.trello.com/1/boards/',
    qs: {
      name,
      defaultLabels: 'true',
      defaultLists: 'true',
      keepFromSource: 'none',
      prefs_permissionLevel: 'private',
      prefs_voting: 'disabled',
      prefs_comments: 'members',
      prefs_invitations: 'members',
      prefs_selfJoin: 'true',
      prefs_cardCovers: 'true',
      prefs_background: 'blue',
      prefs_cardAging: 'regular',
      key,
      token
    }
  };

  return makeRequest(options);
}

async function createList({ name, idBoard, pos }, { key, token }) {
  const options = {
    method: 'POST',
    url: 'https://api.trello.com/1/lists',
    qs: {
      name,
      idBoard,
      pos,
      key,
      token
    }
  };

  return makeRequest(options);
}

async function createCard({ name, desc, due, idList }, { key, token }) {
  const options = {
    method: 'POST',
    url: 'https://api.trello.com/1/cards',
    qs: {
      name,
      desc,
      due,
      idList,
      key,
      token
    }
  };

  return makeRequest(options);
}

/**
 * node bin/index.js
 *    --csv [csv path]
 *    --deadline 2019-01-03
 *    --TRELLO_APP_KEY [app key]
 *    --TRELLO_USER_TOKEN [user token]
 *    --board [board name]
 */
async function deadlineSchedule() {
  const {
    csv,
    deadline,
    TRELLO_APP_KEY,
    TRELLO_USER_TOKEN,
    board
  } = argv

  const input = fs.readFileSync(csv)

  const records = parse(input, {
    columns: true,
    skip_empty_lines: true
  })

  const credential = { key: TRELLO_APP_KEY, token: TRELLO_USER_TOKEN }

  const recordsWithDue = records
    .map(({ Days, Subject, Description }) => {
      const howManyDays = parseInt(Days, 10)
      const Due = moment(deadline).subtract(howManyDays, 'days').format()

      return { Days, Subject, Description, Due }
    })

  const group = _.groupBy(recordsWithDue, (x) => {
    const days = parseInt(x.Days, 10)
    if (days) {
      return Math.ceil(days / 7)
    }

    return days
  })

  const boardResponse = await createBoard({ name: board }, credential)
  const idBoard = JSON.parse(boardResponse).id

  _.each(group, async (records, weeks) => {
    const listResponse = await createList(
      {
        name: `还剩 ${weeks} 周`,
        idBoard,
        pos: 1000 - parseInt(weeks, 10)
      },
      credential
    )
    const idList = JSON.parse(listResponse).id

    records.forEach(async ({ Subject, Description, Due }) => {
      return await createCard({
        name: Subject,
        desc: Description,
        due: Due,
        idList
      }, credential)
    })
  })
}
