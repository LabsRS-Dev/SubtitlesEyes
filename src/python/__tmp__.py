#! /usr/bin/python
# -*- coding: utf-8 -*-

import sys
import os.path

PATH_SELF_SITE = os.path.normpath(os.path.join(os.path.dirname(__file__), 'self-site'))

print('Add myself packages = %s' % PATH_SELF_SITE)
sys.path.append(PATH_SELF_SITE) #规范Windows或者Mac的路径输入

import logging
import json
import tempfile

print os.path.normpath(tempfile.gettempdir())

##引入工具包
#from tools.subliminal.cli import subliminal
from tools.subliminalCLI import subliminalCLI
from tools.subliminalCLI import getLanguageAll




## tornado 服务器部分代码
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import tornado.escape
from tornado.options import define, options


define("port", default=8888, help="run on the given port", type=int)


import json

# 获取JSON字符串
def get_json_message(info):
    jsonData = None
    try:
        import jsonpickle
        jsonData = jsonpickle.encode(info)
    except ImportError:
        jsonData = json.dumps(info, separators=(',', ':'))

    return jsonData


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")


class ChatSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()
    waitersMap = dict()
    cache = []
    cache_size = 200

    def allow_draft76(self):
        # for ios 5.0 safari
        return True

    def check_origin(self, origin):
        return True

    def open(self):
        print ("new client opened, client count = ", len(ChatSocketHandler.waiters))
        ChatSocketHandler.waiters.add(self)

    def on_close(self):
        print ("one client leave, client count = ", len(ChatSocketHandler.waiters))
        ChatSocketHandler.waiters.remove(self)
        ChatSocketHandler.waitersMap.pop(self)


    @classmethod
    def update_cache(cls, chat):
        cls.cache.append(chat)
        if len(cls.cache) > cls.cache_size:
            cls.cache = cls.cache[-cls.cache_size:]


    @classmethod
    def send_update(cls, chat):
        logging.info("sending message to %d waiters", len(cls.waiters))
        for waiter in cls.waiters:
            try:
                waiter.write_message(chat)
            except:
                logging.error("Error sending message", exec_info=True)



    @classmethod
    def send_updateWithId(cls, id, message):
        logging.info("sending message to id=%r waiter message=%r", id, message)
        for key, value in cls.waitersMap.items():
            if value == id:
                waiter = key
                waiter.write_message(message)

    def call_subtitleCLI(self, taskInfo, user_id):
        if taskInfo['cli'] != 'subtitleEyes':
            return
        command = taskInfo['command']
        print command

        # 字符串转换到sys.argv
        for a in command:
            sys.argv.append(a)

        print sys.argv

        ## 处理核心
        data = None
        try:
            info = {
                'task_id': taskInfo['task_id'],
                'task_cli': taskInfo['cli'],
                'msg_type': 's_task_exec_running'
            }
            jsonStr = get_json_message(info)
            ChatSocketHandler.send_updateWithId(user_id, jsonStr)

            # call
            data = subliminalCLI()
        except Exception as e:
            info = {'msg_type':'s_err_progress','content':e.__str__()}
            jsonStr = get_json_message(info)
            ChatSocketHandler.send_updateWithId(user_id, jsonStr)
        else:
            if data is not None:
                #发送处理完毕的消息
                info = {
                    'task_id': taskInfo['task_id'],
                    'task_cli': taskInfo['cli'],
                    'msg_type': 's_task_exec_result',
                    'result': data
                }
                ChatSocketHandler.send_updateWithId(user_id, get_json_message(info))

    def call_getAllLanguageList(self, taskInfo, user_id):
        if taskInfo['cli'] != 'getAllLanguage':
            return

        data = None
        try:
            data = getLanguageAll()
        except Exception as e:
            info = {'msg_type':'s_err_progress','content':e.__str__()}
            jsonStr = get_json_message(info)
            ChatSocketHandler.send_updateWithId(user_id, jsonStr)
        else:
            if data is not None:
                  #发送处理完毕的消息
                info = {
                    'task_id': taskInfo['task_id'],
                    'task_cli': taskInfo['cli'],
                    'msg_type': 's_task_exec_result',
                    'result': data
                }
                ChatSocketHandler.send_updateWithId(user_id, get_json_message(info))


    def on_message(self, message):
        logging.info("got message %r", message)
        dictInfo = eval(message)

        # 清理sys.argv,保证入口数据能够正常运行
        if sys.argv.count > 2:
            del sys.argv[1:]


        # 检查是否符合要求
        if not isinstance(dictInfo, dict):
            return

        # 信息处理{服务器使用s_作为前缀，客户端使用c_作为前缀}
        msg_type = dictInfo['msg_type']
        user_id = dictInfo['user_id']

        if  msg_type == 'c_notice_id_Info':
            ChatSocketHandler.waitersMap[self] = user_id

            info = {'msg_type':'s_get_id_Info'}
            jsonStr = get_json_message(info)

            ChatSocketHandler.send_updateWithId(user_id, jsonStr)

        elif msg_type == 'c_task_exec':
            taskInfo = dictInfo['taskInfo']
            self.call_subtitleCLI(taskInfo, user_id)
            self.call_getAllLanguageList(taskInfo, user_id)

            pass

        #ChatSocketHandler.send_update(message)

class EchoWebSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        print "WebSocket opened"

    def on_message(self, message):
        self.write_message(u"You said: " + message)

    def on_close(self):
        print "WebSocket closed"

    def check_origin(self, origin):
        return True


def main():
    tornado.options.parse_command_line()

    # remove params --port=?
    param_port = '--port=' + str(options.port)
    if param_port in sys.argv:
        sys.argv.remove(param_port)

    # create application
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/websocket", ChatSocketHandler)
    ])
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    print('start web server on port: ', options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()