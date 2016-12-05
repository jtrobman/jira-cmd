/*global requirejs,console,define,fs*/
define([
  'commander',
  'superagent',
  'cli-table',
  'moment',
  '../../lib/config'
], function (program, request, Table, moment, config) {
  var worklog = {

    add: function (issue, timeSpent, comment, startedAt) {
      var url = 'rest/api/latest/issue/' + issue + '/worklog';

      var formattedStart = moment(startedAt).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');

      request
        .post(config.auth.url + url)
        .send({
          comment : comment,
          timeSpent : timeSpent,
          started : formattedStart
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end(function (res) {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }

          return console.log('Worklog to issue [' + issue + '] was added!');
        });
    },

    addByQuery: function (query, timeSpent, comment, startedAt) {

      var url = 'rest/api/2/search?jql='
        + 'summary+~+"' + query + '"'
        + '+OR+description+~+"' + query + '"'
        + '+OR+comment+~+"' + query + '"'
        + '+order+by+priority+DESC,+key+ASC';

      var that = this;

      request
        .get(config.auth.url + url)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end(function (res) {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }

          that.issues = res.body.issues;

          if (that.issues.length > 0) {
            issue = that.issues[0].key;

            var url = 'rest/api/latest/issue/' + issue + '/worklog';

            var formattedStart = moment(startedAt).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');

            request
              .post(config.auth.url + url)
              .send({
                comment : comment,
                timeSpent : timeSpent,
                started : formattedStart
              })
              .set('Content-Type', 'application/json')
              .set('Authorization', 'Basic ' + config.auth.token)
              .end(function (res) {
                if (!res.ok) {
                  return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }

                return console.log('Worklog to issue [' + issue + ' ' + that.issues[0].fields.summary + '] was added!');
              });

          } else {
            console.log('No issues');
          }

        });



    },

    show: function (issue) {
      var url = 'rest/api/latest/issue/' + issue + '/worklog';

      request
        .get(config.auth.url + url)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end(function (res) {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }

          if (res.body.total == 0) {
            console.log('No work yet logged');
            return;
          }

          var tbl = new Table({
            head: ['Date', 'Author', 'Time Spent', 'Comment']
          }),
            worklogs = res.body.worklogs;

          for(i = 0; i < worklogs.length; i++) {
            var startDate = worklogs[i].created,
                author = worklogs[i].author.displayName,
                timeSpent = worklogs[i].timeSpent,
                comment = worklogs[i].comment || '';

            if (comment.length > 50) {
              comment = comment.substr(0, 47) + '...';
            }

            tbl.push([
              startDate,  //TODO format date
              author,
              timeSpent,
              comment
            ]);

          }

          console.log(tbl.toString());
        });
    }
  };

  return worklog;
});
