#!/usr/bin/env python

import argparse
import sys
import os.path
import requests

HOST = 'http://debug.boopjs.com:8001'

def auth_header(access_token):
    return { 'Authorization': 'Bearer ' + access_token }

def read_access_token():
    with open(os.path.join(os.path.expanduser('~'), '.boop', 'access-token')) as f:
        return f.read().strip()

def is_url(str):
    return str.startswith('http://') or str.startswith('https://')

def upload_file_to_url(file, url):
    with open(file, 'rb') as data:
        r = requests.put(
            url,
            data = data
        )
        if r.status_code != 200:
            raise Exception('HTTP {0} ({1}) - {2}'.format(r.status_code, r.url, r.text))

def upload_from_url(access_token, app_id, app_url):
    r = requests.put(
        HOST + '/api/v1/app/' + app_id,
        headers = auth_header(access_token),
        data = { 'url': app_url }
    )
    if r.status_code != 200:
        raise Exception('HTTP {0} ({1}) - {2}'.format(r.status_code, r.url, r.text))

def upload_from_s3(access_token, app_id, s3_bucket, s3_path):
    r = requests.put(
        HOST + '/api/v1/app/' + app_id,
        headers = auth_header(access_token),
        data = { 's3_bucket': s3_bucket, 's3_path': s3_path }
    )
    if r.status_code != 200:
        raise Exception('HTTP {0} ({1}) - {2}'.format(r.status_code, r.url, r.text))

def upload_from_file(access_token, app_id, file):
    r = requests.post(
        HOST + '/api/v1/s3/sign_upload',
        headers = auth_header(access_token)
    )
    if r.status_code != 200:
        raise Exception('HTTP {0} ({1}) - {2}'.format(r.status_code, r.url, r.text))
    response = r.json()
    upload_file_to_url(file, response['signed_request'])
    upload_from_s3(access_token, app_id, response['s3_bucket'], response['s3_path'])

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Manage apps on boop.js')
    parser.add_argument('action', choices=['upload'], help='Action to perform')
    parser.add_argument('app_id', type=str, help='Your app ID')
    parser.add_argument('file_or_url', type=str, help='Build to use')
    parser.add_argument('--access-token', type=str, help='Access token to use (overrides ~/.boop/access-token)')
    args = parser.parse_args()

    access_token = args.access_token or read_access_token()

    if args.action == 'upload':
        if is_url(args.file_or_url):
            upload_from_url(access_token, args.app_id, args.file_or_url)
        else:
            upload_from_file(access_token, args.app_id, args.file_or_url)
    else:
        parser.print_help()
