#!/usr/bin/env python2

import time
import logging
import requests
from pynagios import Range
from urlparse import urljoin
from requests.auth import HTTPBasicAuth
from pynagios import Plugin, Response, CRITICAL, make_option


class GraphDBCheck(Plugin):
    url = make_option('-l', '--url', metavar='<url>', help='URL to check', dest="url", type='string')
    repository = make_option('-r', '--repository', metavar='<repository>', help='Repository to check', dest="repository",
                             type='string')
    user = make_option('-u', '--user', metavar='<basic_auth_user>', help='User for auth', dest="user")
    password = make_option('-p', '--password', metavar='<basic_auth_password>', help='Password for auth', dest="password")
    checks = make_option('-k', '--checks', metavar='<checks>',
                         help='Array of checks to perform. e.g. read-availability;long-running-queries',
                         dest="checks")
    debug = make_option('-d', '--debug', metavar='<debug>', help='set log level to debug', action="store_true", dest="debug")

    def check(self):
        if self.options.debug:
            logging.basicConfig(level=logging.DEBUG)
        else:
            logging.basicConfig(level=logging.INFO)
            logging.getLogger("urllib3").setLevel(logging.WARNING)

        payload = {}
        auth = None

        if self.options.user and self.options.password:
            auth = HTTPBasicAuth(self.options.user, self.options.password)
        if self.options.checks:
            payload['checks'] = []
            for check in self.options.checks.split(';'):
                payload['checks'].append(check)

        final_url = urljoin(self.options.url, '/repositories/' + self.options.repository + '/health')

        start = time.time()
        try:
            response = requests.get(final_url, params=payload, auth=auth)
            total_time = time.time() - start
        except Exception as ex:
            return Response(CRITICAL, "Error occurred while making connection to GraphDB instance:\n%s" % ex)

        if self.options.critical is None:
            self.options.critical = Range('@500:')
        if self.options.warning is None:
            self.options.warning = Range('@206:500')

        result = self.response_for_value(response.status_code, "Repository[%s] at [%s]\nResponse: %s\nResponse time: %ss\n" % (
            self.options.repository, self.options.url, trim_response(response.text), total_time))
        result.set_perf_data('response-time', total_time, uom='s')

        for check, state in response.json().iteritems():
            if check == 'status' or check == 'master-status':
                if state == 'green':
                    status_in_percent = 100
                elif state == 'yellow':
                    status_in_percent = 50
                else:
                    status_in_percent = 0
                result.set_perf_data(check, status_in_percent, uom='%', warn=Range('50'), crit=Range('0'))
            else:
                if state == 'OK':
                    status_in_percent = 100
                else:
                    status_in_percent = 0
                result.set_perf_data(check, status_in_percent, uom='%', warn=Range('50'), crit=Range('0'))

        return result

def trim_response(response):
    if '|' in response:
        return response[:response.find("|")].rstrip() + ' ...'
    return response

if __name__ == "__main__":
    GraphDBCheck().check().exit()
