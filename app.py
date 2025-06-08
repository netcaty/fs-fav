from flask import Flask, request, jsonify
from flask_cors import CORS

import lark_oapi as lark

from lark_oapi.api.bitable.v1 import *
from lark_oapi.adapter.flask import *
from lark_oapi.api.im.v1 import *

import json
import random
# SDK 使用说明: https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/server-side-sdk/python--sdk/preparations-before-development
# 以下示例代码默认根据文档示例值填充，如果存在代码问题，请在 API 调试台填上相关必要参数后再复制代码使用
# 复制该 Demo 后, 需要将 "YOUR_APP_ID", "YOUR_APP_SECRET" 替换为自己应用的 APP_ID, APP_SECRET.
def addRecord(data):
    # 创建client
    client = lark.Client.builder() \
        .app_id(data.get("app_id", "")) \
        .app_secret(data.get("app_secret", "")) \
        .log_level(lark.LogLevel.DEBUG) \
        .build()

    # 构造请求对象
    fields = {
        "网址": {
			"link": data.get("url", ""),
			"text": data.get("url", "")
		},
        "介绍": data.get("content", ""),
        "分类": [data.get("category", "")]
    }
    request = CreateAppTableRecordRequest.builder() \
        .table_id(data.get("table_id", "")) \
        .app_token(data.get("app_token", "")) \
        .request_body(AppTableRecord.builder() \
            .fields(fields) \
            .build()) \
        .build()

    # 发起请求
    response: CreateAppTableRecordResponse = client.bitable.v1.app_table_record.create(request)

    # 处理业务结果
    lark.logger.info(lark.JSON.marshal(response.data, indent=4))

    return response


app = Flask(__name__)
CORS(app)


#@app.route("/event", methods=["POST"])
def event():
    resp = handler.do(parse_req())
    return parse_resp(resp)

@app.route("/add", methods=["POST"])
def add():
    # Get the request body
    data = request.get_json(force=True)
    
    response = addRecord(data)

    # Handle error response
    if not response.success():
        lark.logger.error(
            f"client.bitable.v1.app_table_record.create failed, code: {response.code}, msg: {response.msg}, log_id: {response.get_log_id()}, resp: \n{json.dumps(json.loads(response.raw.content), indent=4, ensure_ascii=False)}")
        return jsonify({"error": response.msg}), 400

    # Return success response
    return jsonify({"data": 1}), 200

@app.route("/", methods=["GET"])
def info():
    return jsonify({
        "application": app.name,
        "environment": app.config.get('ENV'),
        "debug_mode": app.debug,
    })


if __name__ == "__main__":
    app.run(port=8000, debug=True)