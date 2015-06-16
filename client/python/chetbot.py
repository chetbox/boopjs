#!/usr/bin/env python

from websocket import WebSocket
from uuid import uuid4
import json
import time

NAME = 'name'
ARGS = 'args'

# TODO: reconnect if disconnected
__ws = WebSocket()
__ws.connect('ws://ec2-54-77-127-243.eu-west-1.compute.amazonaws.com')

class View:
    '''Select and interact with views based on their appearance

You must specify at least one of:
    text - The text label to match
    type - The class name of the view
    id - The Android ID given to the view'''

    device = 'my_magic_device_1234567890'

    def __init__(self, text=None, type=None, id=None):
        self.__commands = []

        if text or type or id:
            self.view(text, type, id)

    def view(self, text=None, type=None, id=None):
        'Select all matching subviews'
        self.__add('VIEW', text, type, id)
        return self

    def id(self):
        'The ID of the first view'
        self.__add('ID')
        return self.__execute()

    def type(self):
        'The class of the first view'
        self.__add('TYPE')
        return self.__execute()

    def count(self):
        'The number of views'
        self.__add('COUNT')
        return self.__execute()

    def exists(self):
        '''Check if the view(s) exist(s).
True if any views are selected, False otherwise'''
        self.__add('EXISTS')
        return self.__execute()

    def leftmost(self):
        'Select the leftmost view'
        self.__add('LEFTMOST')
        return self

    def rightmost(self):
        'Select the rightmost view'
        self.__add('RIGHTMOST')
        return self

    def topmost(self):
        'Select the topmost View'
        self.__add('TOPMOST')
        return self

    def bottommost(self):
        'Select only the bottommost view'
        self.__add('BOTTOMMOST')
        return self

    def closest_to(self, text=None, type=None, id=None):
        'Select the view closest to the view specified'
        self.__add('CLOSEST_TO', text, type, id)
        return self

    def furthest_from(self, text=None, type=None, id=None):
        'Find the view furthest from the view specified from those currently selected'
        self.__add('FURTHEST_FROM', text, type, id)
        return self

    def text(self):
        'Get the text of the first view'
        self.__add('TEXT')
        return self.__execute()

    def location(self):
        'Get the (left,top) location of the first view in pixels'
        self.__add('LOCATION')
        return self.__execute()

    def size(self):
        'Get the (width,height) size of the first view in pixels'
        self.__add('SIZE')
        return self.__execute()

    def center(self):
        'Get the (x,y) position of the center of the first view in pixels'
        self.__add('CENTER')
        return self.__execute()

    def tap(self):
        'Tap on the first view specified'
        self.__add('TAP')
        self.__execute()
        return self

    def __add(self, cmd, *args):
       self.__commands.append({NAME: cmd,
                               ARGS: args})

    def __execute(self):
        msg = {
            'request':  str(uuid4()),
            'device':   View.device,
            'commands': self.__commands
        }
        __ws.send(json.dumps(msg))
        response = json.loads(self.__ws.recv())
        if response.has_key('error'):
            raise Exception(response['error'])
        return response['result']

__ = View
wait = time.sleep

if __name__ == '__main__':

    __('reset').tap()

    assert(__('00').closest_to('mins').location()[0] < __('00').closest_to('secs').location()[0])
    assert(__(id='milliseconds').text() == '000')

    __('start').tap()
    wait(2)
    __('stop').tap()

    assert(__(id='minutes').text() == '00')
    assert(__(id='seconds').text() == '02')

    assert(__('reset').count() == 1)
    assert(__('start').exists())
    assert(not(__('stop').exists()))

    print('Elapsed: ' +
          __(id='minutes').text() + ':' +
          __(id='seconds').text() + '.' +
          __(id='milliseconds').text())
