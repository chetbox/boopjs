#!/usr/bin/env python

import requests
import json
import time

NAME = 'name'
ARGS = 'args'

host = 'http://192.168.0.21:8897'

class View:

    def __init__(self, text=None, type=None, id=None):
        self.__commands = []
        if text or type or id:
            self.__add('VIEW', text, type, id)

    def count(self):
        self.__add('COUNT')
        return self.__execute()

    def exists(self):
        self.__add('EXISTS')
        return self.__execute()

    def leftmost(self):
        self.__add('LEFTMOST')
        return self

    def rightmost(self):
        self.__add('RIGHTMOST')
        return self

    def topmost(self):
        self.__add('TOPMOST')
        return self

    def bottommost(self):
        self.__add('BOTTOMMOST')
        return self

    def closest_to(self, text=None, type=None, id=None):
        '''TODO: allow a view selector as an argument'''
        self.__add('CLOSEST_TO', text, type, id)
        return self

    def text(self):
        self.__add('TEXT')
        return self.__execute()

    def location(self):
        self.__add('LOCATION')
        return self.__execute()

    def size(self):
        self.__add('SIZE')
        return self.__execute()

    def center(self):
        self.__add('CENTER')
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

    __('reset').tap()

    assert(__('00').closest_to('mins').location()[0] < __('00').closest_to('secs').location())
    assert(__(id='milliseconds').text() == '000')

    __('start').tap()
    wait(2)
    __('stop').tap()

    assert(__(id='minutes').text() == '00')
    assert(__(id='seconds').text() == '02')

    assert(__('reset').count() == 1)
    assert(__('start').exists())
    assert(not(__('stop').exists()))
