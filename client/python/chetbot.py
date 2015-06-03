#!/usr/bin/env python

import requests
import json
import time

NAME = 'name'
ARGS = 'args'

host = 'http://192.168.0.21:8897'

class View:

    def __init__(self, text, type=None, id=None):
        self.__commands = []
        self.__commands.append({NAME: 'VIEW',
                                ARGS: [text, type, id]})

    def text(self):
        self.__commands.append({NAME: 'TEXT'})
        r = self.__execute()
        if r.status_code != 200:
            raise Exception(r.content)
        return json.loads(r.content)

    def tap(self):
        self.__commands.append({NAME: 'TAP'})
        return self.__execute()

    def __execute(self):
        return requests.post(host, params={'commands':json.dumps(self.__commands)})

__ = View
wait = time.sleep

if __name__ == '__main__':
    from time import sleep

    __('start').tap()
    wait(1)
    __('stop').tap()

