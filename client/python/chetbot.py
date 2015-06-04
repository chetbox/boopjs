#!/usr/bin/env python

import requests
import json
import time

NAME = 'name'
ARGS = 'args'

host = 'http://localhost:8897'

class View:

    def __init__(self, text=None, type=None, id=None):
        self.__commands = []
        if text or type or id:
            self.__add('VIEW', text, type, id)

    def count(self):
        self.__add('COUNT')
        return self.__execute()

    def text(self):
        self.__add('TEXT')
        return self.__execute()

    def tap(self):
        self.__add('TAP')
        self.__execute()
        return self

    def __add(self, cmd, *args):
       self.__commands.append({NAME: cmd,
                               ARGS: args})

    def __execute(self):
        r = requests.post(host, params={'commands':json.dumps(self.__commands)})
        if r.status_code != 200:
            raise Exception(r.content)
        return json.loads(r.content)

__ = View
wait = time.sleep

if __name__ == '__main__':
    __('start').tap()
    wait(1)
    __('stop').tap()
    print __('mins').text()
