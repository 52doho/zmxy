import querystring from 'querystring';
import request from 'request-promise-native';
import crypto from 'crypto';

const constants = parseInt(process.versions.node, 10) <= 4 ? require('constants') : crypto.constants;

const random = (len = 16) => {
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
  let str = '';
  for (let i = 0; i < len; i += 1) {
    const rand = Math.floor(Math.random() * digits.length);
    if (rand !== 0 || str.length > 0) {
      str += digits[rand];
    }
  }
  return str;
};

/**
 * Zhima Credit Client
 */
export default class ZmxyClient {
  version = '1.0'; //不能更改
  url = 'https://zmopenapi.zmxy.com.cn/openapi.do'; //没有测试环境，无法更改
  charset = 'UTF-8';
  platform = 'zmop'; //不能更改，更改后会报 ZMOP.invalid_platform_param
  appId = null; //芝麻App ID
  appPrivateKey = null; //App私钥
  zmxyPublicKey = null; //芝麻公钥
  randomFunc = null; //随机字符串算法
  options = {};

  /**
   * @param client
   * @param appId
   * @param appPrivateKey
   * @param zmxyPublicKey
   * @param randomFunc
   */
  constructor({
    client,
    appId,
    appPrivateKey,
    zmxyPublicKey,
    randomFunc
  }) {
    this.client = client || request;
    this.appId = appId;
    this.appPrivateKey = appPrivateKey;
    this.zmxyPublicKey = zmxyPublicKey;
    this.randomFunc = randomFunc || random;
    this.setOptions({});
  }

  /**
   * @param {Object} options
   * @returns {ZmxyClient}
   */
  setOptions(options) {
    this.options = Object.assign({
      version: this.version,
      platform: this.platform,
      channel: 'apppc',
      charset: this.charset,
      app_id: this.appId
    }, options);
    return this;
  }

  /**
   * 数据反馈
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=FEEDBACK_DOC
   * @param typeId
   * @param records
   * @returns {Promise.<{params: *, request, response: *, result: *}>}
   */
  async batchFeedback(typeId, records) {
    return this.request('zhima.data.batch.feedback', {
      file_type: 'json_data',
      file_charset: 'UTF-8',
      records: records.length,
      columns: 'user_name,user_credentials_type,user_credentials_no,order_no,biz_type,order_status,create_amt,pay_month,gmt_ovd_date,overdue_days,overdue_amt,gmt_pay,memo',
      primary_key_columns: 'order_no,pay_month',
      type_id: typeId,
      files: {
        file: {
          value: JSON.stringify({ records }),
          options: {
            filename: 'records.json'
          }
        }
      }
    });
  }

  /**
   * 获得反欺诈评分
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.antifraud.score.get@1.0@1.1
   * @param params
   * @returns {{params, request, response, result}|*}
   */
  async getIvsScore(params) {
    return this.request('zhima.credit.antifraud.score.get',
      Object.assign({
        product_code: 'w1010100003000001100',
        transaction_id: this.randomFunc(32),
        cert_type: 'IDENTITY_CARD'
      }, params)
    );
  }

  /**
   * 反欺诈信息验证
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.antifraud.verify@1.0@1.1
   * @param params
   * @returns {{params, request, response, result}|*}
   */
  async verifyIvs(params) {
    return this.request('zhima.credit.antifraud.verify',
      Object.assign({
        product_code: 'w1010100000000002859',
        transaction_id: this.randomFunc(32),
        cert_type: 'IDENTITY_CARD'
      }, params)
    );
  }

  /**
   * 获得反欺诈关注名单
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.antifraud.risk.list@1.0@1.0
   * @param params
   * @returns {{params, request, response, result}|*}
   */
  async getIvsWatchList(params) {
    return this.request('zhima.credit.antifraud.risk.list',
      Object.assign({
        product_code: 'w1010100003000001283',
        transaction_id: this.randomFunc(32),
        cert_type: 'IDENTITY_CARD'
      }, params)
    );
  }

  /**
   * 行业关注名单验证
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.watchlistii.get@1.0@1.0&relType=API_DOC&type=API_INFO_DOC&LEFT_MENU_MODE=null
   * @param openId
   * @param transactionId
   * @returns {{params, request, response, result}|*}
   */
  async verifyWatchlist(openId, transactionId) {
    return this.request('zhima.credit.watchlistii.get', {
      product_code: 'w1010100100000000022',
      transaction_id: transactionId || this.randomFunc(32),
      open_id: openId
    });
  }

  /**
   * 获得芝麻信用评分
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?relInfo=zhima.credit.score.get@1.0@1.4&relType=API_DOC&type=API_INFO_DOC&LEFT_MENU_MODEnull
   * @param openId
   * @param transactionId
   * @returns {{params, request, response, result}|*}
   */
  async getCreditScore(openId, transactionId) {
    return this.request('zhima.credit.score.get', {
      product_code: 'w1010100100000000001',
      transaction_id: transactionId || this.randomFunc(32),
      open_id: openId
    });
  }

  /**
   * 芝麻认证初始化
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?id=601
   * @param realName
   * @param idCard
   * @returns {{params, request, response, result}|*}
   */
  async initCertification(realName, idCard) {
    return this.request('zhima.customer.certification.initialize', {
      transaction_id: this.randomFunc(32),
      product_code: 'w1010100000000002978',
      biz_code: 'FACE',
      identity_param: JSON.stringify({
        identity_type: 'CERT_INFO',
        cert_type: 'IDENTITY_CARD',
        cert_name: realName,
        cert_no: idCard
      })
    });
  }

  /**
   * 获取芝麻认证url
   * @param bizNo
   * @param returnUrl
   * @returns {string}
   */
  getCertificationCertifyUrl(bizNo, returnUrl) {
    const paramsString = this.paramsToString({
      biz_no: bizNo,
      return_url: returnUrl
    });

    const sign = this.sign(paramsString);

    const urlQueryString = this.paramsToString(
      Object.assign({ method: 'zhima.customer.certification.certify', sign }, this.options)
    );

    const encryptParams = this.encrypt(paramsString);

    return `${this.url}?${urlQueryString}&params=${encodeURIComponent(encryptParams)}`;
  }

  /**
   * 查询芝麻认证结果
   * @param bizNo
   * @returns {Promise.<{params: *, request, response: *, result: *}>}
   */
  async queryCertification(bizNo) {
    return this.request('zhima.customer.certification.query', {
      biz_no: bizNo
    });
  }

  /**
   * 获取鉴权URL
   * @refer https://b.zmxy.com.cn/technology/openDoc.htm?id=67
   * @param name
   * @param mobile
   * @param certNo
   * @param state
   * @param _authBy 鉴权方式： PC | H5
   */
  getAuthorizeUrl({
    name,
    mobile,
    certNo,
    state
  }, _authBy = 'pc') {
    const identityParam = certNo
      ? {
        name,
        certNo,
        certType: 'IDENTITY_CARD'
      } : {
        mobileNo: mobile
      };
    const identityType = certNo ? '2' : '1';

    //Auth code 由用户终端(PC端或移动端)以及验证方式(验证身份证或手机号)共同决定
    const authCodes = {
      pc_1: 'M_MOBILE_APPPC',
      pc_2: 'M_APPPC_CERT',
      h5_1: 'M_H5',
      h5_2: 'M_H5'
    };
    let authBy = _authBy.toLowerCase();
    if (!['pc', 'h5'].includes(authBy)) {
      authBy = 'pc';
    }
    const authCode = authCodes[`${authBy}_${identityType}`];
    const channels = {
      pc: 'apppc',
      h5: 'app'
    };
    const channel = channels[authBy];

    const bizParams = {
      auth_code: authCode,
      state
    };
    const paramsString = this.paramsToString({
      identity_type: identityType,
      identity_param: JSON.stringify(identityParam),
      biz_params: JSON.stringify(bizParams)
    });
    const sign = this.sign(paramsString);
    const query = Object.assign({
      method: 'zhima.auth.info.authorize',
      params: this.encrypt(paramsString),
      sign
    }, this.options, { channel });
    return {
      identity_type: identityType,
      identity_param: identityParam,
      biz_params: bizParams,
      url: `${this.url}?${querystring.stringify(query)}`
    };
  }

  /**
   * 根据Callback参数获得OpenId对象
   * @param {String} callbackString
   * @returns {Object}
   */
  getOpenId(callbackString) {
    return this.stringToParams(this.decrypt(callbackString));
  }

  /**
   * 公钥加密
   * @param {String} text
   * @param {Number} blockSize
   * @param {String} publicKey
   * @returns {String}
   */
  encrypt(text, blockSize = 128, publicKey = this.zmxyPublicKey) {
    const padding = 11;
    const chunkSize = blockSize - padding;
    const inputBuffer = new Buffer(text);
    const chunksCount = Math.ceil(inputBuffer.length / (chunkSize));
    const outputBuffer = new Buffer(chunksCount * blockSize);
    for (let i = 0; i < chunksCount; i += 1) {
      const currentBlock = inputBuffer.slice(chunkSize * i, chunkSize * (i + 1));
      const encryptedChunk = crypto.publicEncrypt({
        key: publicKey,
        padding: constants.RSA_PKCS1_PADDING
      }, currentBlock);
      encryptedChunk.copy(outputBuffer, i * blockSize);
    }
    return outputBuffer.toString('base64');
  }

  /**
   * 私钥解密
   * @param {String} encrypted
   * @param {String} privateKey
   * @returns {String}
   */
  decrypt(encrypted, privateKey = this.appPrivateKey) {
    const chunkSize = 128;
    const decodedBuffer = new Buffer(encrypted, 'base64');
    const chunksCount = Math.ceil(decodedBuffer.length / (chunkSize));
    const outputBuffer = new Buffer(chunksCount * chunkSize);
    let totalLength = 0;
    for (let i = 0; i < chunksCount; i += 1) {
      const currentBlock = decodedBuffer.slice(
        chunkSize * i, Math.min(chunkSize * (i + 1), decodedBuffer.length));
      const decryptedBuf = crypto.privateDecrypt({
        key: privateKey,
        padding: constants.RSA_PKCS1_PADDING
      }, currentBlock);

      decryptedBuf.copy(outputBuffer, totalLength);
      totalLength += decryptedBuf.length;
    }
    return outputBuffer.slice(0, totalLength).toString();
  }

  /**
   * 字符串转换为业务参数
   * @param paramsString
   */
  stringToParams(paramsString) {
    return querystring.parse(paramsString);
  }

  /**
   * 业务参数转换为字符串
   * @param {Object} params
   * @returns {string}
   */
  paramsToString(params) {
    const sortedParams = Object.keys(params).sort().reduce((r, k) => (r[k] = params[k], r), {}); //eslint-disable-line
    return Object.entries(sortedParams)
      .filter(([, value]) => ![null, ''].includes(value))
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * 对字符串生成签名
   * @param {String} input
   * @param {String} key
   * @returns {String}
   */
  sign(input, key = this.appPrivateKey) {
    return crypto.createSign('RSA-SHA1').update(input, 'utf8').sign(key, 'base64');
  }

  /**
   * 验证签名
   * @param {String} expected
   * @param {String} sign
   * @param {String} key
   * @returns {Boolean}
   */
  verify(expected, sign, key = this.zmxyPublicKey) {
    return crypto.createVerify('RSA-SHA1').update(expected, 'utf8').verify(key, sign, 'base64');
  }

  /**
   * 发起一个API请求
   * @param {String} service
   * @param {Object} params
   * @returns {{params: *, request, response: *, result: *}}
   */
  async request(service, params) {
    const paramsString = this.paramsToString(params);
    const sign = this.sign(paramsString);
    const files = params.files;
    const requestParams = {
      method: 'POST',
      url: this.url,
      qs: Object.assign({ method: service, sign }, this.options),
      json: true,
      resolveWithFullResponse: true
    };
    if (files) {
      requestParams.formData = {
        params: this.encrypt(paramsString)
      };
      Object.keys(files).forEach((key) => {
        requestParams.formData[key] = files[key];
      });
    } else {
      requestParams.form = {
        params: this.encrypt(paramsString)
      };
    }

    const response = await this.client(requestParams);
    const {
      request: req,
      body
    } = response;
    const {
      encrypted,
      biz_response: result
    } = body;

    return {
      params,
      request: req,
      response,
      result: encrypted ? JSON.parse(this.decrypt(result)) : JSON.parse(result)
    };
  }
}
