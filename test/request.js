import fs from 'fs';
import Url from 'url';
import querystring from 'querystring';
import test from 'ava';
import nock from 'nock';
import ZmxyClient from '../src/index';

let zmxyClient = {};
test.before(() => {
  zmxyClient = new ZmxyClient({
    platform: 'bmqb',
    appId: '1000980',
    appPrivateKey: fs.readFileSync(`${__dirname}/_keys/app_private_key.pem`),
    zmxyPublicKey: fs.readFileSync(`${__dirname}/_keys/zmxy_public_key.pem`)
  });
});

test('Get auth url by mobile during pc', async (t) => {
  const { url, identity_type, identity_param: { mobileNo }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    mobile: '12345678901'
  });
  t.is(identity_type, '1');
  t.is(mobileNo, '12345678901');
  t.is(auth_code, 'M_MOBILE_APPPC');
  const {
    protocol,
    host,
    pathname,
    query
  } = Url.parse(url);
  t.is(protocol, 'https:');
  t.is(host, 'zmopenapi.zmxy.com.cn');
  t.is(pathname, '/openapi.do');
  const qs = querystring.parse(query);
  t.is(qs.method, 'zhima.auth.info.authorize');
});

test('Get auth url by mobile during h5', async (t) => {
  const { identity_type, identity_param: { mobileNo }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    mobile: '12345678901'
  }, 'h5');
  t.is(identity_type, '1');
  t.is(mobileNo, '12345678901');
  t.is(auth_code, 'M_H5');
});

test('Get auth url by name during pc', async (t) => {
  const { identity_type, identity_param: { name, certNo, certType }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    name: '张三',
    certNo: '111111111111111111'
  }, 'strange');
  t.is(identity_type, '2');
  t.is(name, '张三');
  t.is(certNo, '111111111111111111');
  t.is(certType, 'IDENTITY_CARD');
  t.is(auth_code, 'M_APPPC_CERT');
});

test('Get auth url by name during h5', async (t) => {
  const { identity_type, identity_param: { name, certNo, certType }, biz_params: { auth_code } } = zmxyClient.getAuthorizeUrl({
    name: '张三',
    certNo: '111111111111111111'
  }, 'h5');
  t.is(identity_type, '2');
  t.is(name, '张三');
  t.is(certNo, '111111111111111111');
  t.is(certType, 'IDENTITY_CARD');
  t.is(auth_code, 'M_H5');
});

test('Get open id', async (t) => {
  const { open_id } = zmxyClient.getOpenId(
    'WRK8lfrvYpCLG/f36NZjtkpj7epnIEJWKkKXFR/gl17a0lnvqraAVT0NaT0A0t8BQZLYtRTamzX4K4VFXTsq2qXx7Wppo2wDQObQjsKv7BAPbIjj4+fuP0W6L7qKnmx3nZtBPBPqcFAwrVEyWgCtNDtkrcirKPI19h6rJCnzhzHUIWCBqvk1kuJcOViwHyWOz6s78PiX6odZ5rPPBLIXahyixU95SnvMlUCyLXICclE80nuzkFscs1maHFcG5Rkj35cKkW0m0rbLVsPQKksfvjbvQRMGiqylinaqWcdbeCKPB+TjofN+kglwdtlI9mFNybNN4/Su3BwryKQOOSBTXw=='
  );
  t.truthy(open_id);
});


test('Verify IVS', async (t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'a6HnxiwZACvEYY0Z5CUr+4AKGoGCtyevkvUxyNMsCQeKetsecRcWuZURaNa5/jv/DEvHSivI7RGyEKYDrV9+n6xfms1Vecs+mSS97kgndcbaC2gOvq7t2IH8VmhYqU73ADJaJFcnP3rTPUd65LecszgGpeAdN4gzMcqj9AXMF+w=',
      biz_response: 'hzvM1iKNucZYODQNQjpuC0sxp0pMm0kKiG7VIbudPAbw1G4WDn+73Bl3+uKK4IZb9J9KYdg1kM2+0YIAD1Ed+ed9kuE1u3/kkkfib60rlKMjnT8GIABCNx1s4rL4dcXZ5eVvnXLFqclUPZcEFSSjy6LwVEW6gZggv3ldMmr/0Ek='
    });
  const { params, request, result } = await zmxyClient.verifyIvs({
    name: '张三',
    cert_no: '532926200804058748',
    mobile: '17348890449'
  });
  const publicKey = fs.readFileSync(`${__dirname}/_keys/app_public_key.pem`);
  const query = querystring.parse(request.uri.query);
  t.is(request.method, 'POST');
  t.is(params.product_code, 'w1010100000000002859');
  t.is(params.name, '张三');
  t.is(params.mobile, '17348890449');
  t.truthy(params.transaction_id);
  t.is(query.method, 'zhima.credit.antifraud.verify');
  t.is(query.app_id, '1000980');
  t.is(query.charset, 'UTF-8');
  t.is(query.platform, 'zmop');
  t.is(query.version, '1.0');
  t.true(zmxyClient.verify(zmxyClient.paramsToString(params), query.sign, publicKey));
  t.deepEqual(result.verify_code, ['V_CN_NA', 'V_PH_NA']);
});

test('IVS score', async (t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'PvZxI0LY/6jnIcN9Q15zRPC9LhRXsxOQ8IM+epUBJ3dAzjrboBBRZp13jfYoudruBVXQgy367b5WMqdR9W0qEidxHvY/Mp03eB2nFxvMoPsSP2KRVFHfb1F29L8NQ8mUiF36oVxlEh4rHx0ZPEpIRRf/raIBZ1IOz5Iu6hdpwhw=',
      biz_response: 'cy+q7rz6F//sygROQkcTiUEupoKHtseesHbDeNBt84bZo017YRmw0kVFX+KCnje+mGYSiGPO/BZCkucagQFPQN1r2c70RZPABzIaH2Rzml/RnRII9gyh7Ab2LTaWT76sO63b48IlGewt8e30H1vVJW2erb8XFV7TMQXx6+Kw+s4='
    });
  const { params, request, result } = await zmxyClient.getIvsScore({
    name: '张三',
    cert_no: '532926200804058748',
    mobile: '17348890449'
  });
  const publicKey = fs.readFileSync(`${__dirname}/_keys/app_public_key.pem`);
  const query = querystring.parse(request.uri.query);
  t.is(request.method, 'POST');
  t.is(params.product_code, 'w1010100003000001100');
  t.is(params.name, '张三');
  t.is(params.mobile, '17348890449');
  t.truthy(params.transaction_id);
  t.is(query.method, 'zhima.credit.antifraud.score.get');
  t.is(query.app_id, '1000980');
  t.is(query.charset, 'UTF-8');
  t.is(query.platform, 'zmop');
  t.is(query.version, '1.0');
  t.true(zmxyClient.verify(zmxyClient.paramsToString(params), query.sign, publicKey));
  t.is(result.score, 0);
});


test.skip('IVS watchlist', async (t) => {
  nock.restore();
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'PvZxI0LY/6jnIcN9Q15zRPC9LhRXsxOQ8IM+epUBJ3dAzjrboBBRZp13jfYoudruBVXQgy367b5WMqdR9W0qEidxHvY/Mp03eB2nFxvMoPsSP2KRVFHfb1F29L8NQ8mUiF36oVxlEh4rHx0ZPEpIRRf/raIBZ1IOz5Iu6hdpwhw=',
      biz_response: 'cy+q7rz6F//sygROQkcTiUEupoKHtseesHbDeNBt84bZo017YRmw0kVFX+KCnje+mGYSiGPO/BZCkucagQFPQN1r2c70RZPABzIaH2Rzml/RnRII9gyh7Ab2LTaWT76sO63b48IlGewt8e30H1vVJW2erb8XFV7TMQXx6+Kw+s4='
    });
  const { params, request, result } = await zmxyClient.getIvsWatchList({
    name: '张三',
    cert_no: '532926200804058748',
    mobile: '17348890449'
  });
  const publicKey = fs.readFileSync(`${__dirname}/_keys/app_public_key.pem`);
  const query = querystring.parse(request.uri.query);
  t.is(request.method, 'POST');
  t.is(params.product_code, 'w1010100003000001100');
  t.is(params.name, '张三');
  t.is(params.mobile, '17348890449');
  t.truthy(params.transaction_id);
  t.is(query.method, 'zhima.credit.antifraud.score.get');
  t.is(query.app_id, '1000980');
  t.is(query.charset, 'UTF-8');
  t.is(query.platform, 'zmop');
  t.is(query.version, '1.0');
  t.true(zmxyClient.verify(zmxyClient.paramsToString(params), query.sign, publicKey));
  t.is(result.score, 0);
});


test('Verify IVS Error', async(t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: false,
      biz_response: '{"success":false,"error_code":"ZMCREDIT.required_parameters_not_enough","error_message":"所需参数不够"}'
    });
  const { result } = await zmxyClient.verifyIvs({
    name: '',
    mobile: '12345678901'
  });

  t.is(result.success, false);
});

test('Verify watchlist', async(t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'MNbiY+5IMZuQgGadVsv/pfnz3d4RRBm5ETQBN3cv2nSAwmzFHM08zNlFYxz21lx016A1p7DtCeE2PV+WSK8fXrOc4LXRs5nhdNpq9TVbIMvPGmw1o9FUaXJjQjeHU2WS30pxdZXynbuuKEfvqp+9GqI2GCqjrnuKF0e7NEs9+5c=',
      biz_response: 'VvfJ2o4dSJP9xceYGnT44ovHPfJXnPv9un6Stn56nSZshGp9GlXR+GisLwgPgFiXEJaw1TmL4ti77v9FW+wQejS6gFZadSTrIj94b2jcdo3AJ0ZV2hdr/O0MzHI77+N3SqlF3w7upwWzGYEoHWx2bmLKuhoOVjQ4uLVxCQp8m8w='
    });
  const { params, request, result } = await zmxyClient.verifyWatchlist('268807750994492945066168772');
  const query = querystring.parse(request.uri.query);
  t.false(result.is_matched);
  t.is(params.product_code, 'w1010100100000000022');
  t.is(query.method, 'zhima.credit.watchlistii.get');
});

test('Get score', async(t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'NtjFCeugTs93kx1XsRWW93vQzofkhXwIPDVRNe3hHbG3bQVltttBWWGrAS8gkxn/ncsw5TRSWn5DZFb4xV6P4m1nDX1JKU2ac2M2Xt01ZkATcMkZ2oktTobhS292sP7l2O5QvK+amzUZY6IA2ZshKI2N1B1Y1astxBodWXklUV0=',
      biz_response: 'YswXpDhZwOiLMjh4OrMgvyiM0eScLLVtjVf3EwRUEjdXW3fscGIYe6KI4ErwcLMAcSYumrUfwSYUTXSjXXW1EYODkt/Wcu9i1rXq7LbliArtvNTphWtF7kef597J1YxwG2J9JXWCrdOMvmc6+hRd+ebMqC27OySsusVz4w/C3rc='
    });
  const { params, request, result: { zm_score } } = await zmxyClient.getCreditScore('some open id');
  const query = querystring.parse(request.uri.query);
  t.truthy(zm_score);
  t.is(params.product_code, 'w1010100100000000001');
  t.is(query.method, 'zhima.credit.score.get');
});

test('Certification init', async(t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'VYXaDK2PVyZDzWuy/v9VjuXeg5A1ZW82nzFV9+vdmRzcq7AyO2J6Sd9Hb34SVGveSHz03GE1q0bjD6Yq5agVFYC46xkWjUHXowWRDm4lrnNrcQ4st3XvhHmbdhklU8SvXnqHUKqScFF2zTTS6OnsbmpsjyCo9zxK3L9/ubZtcWI=',
      biz_response: 'Dcn58PDfq98T5zPa5z2RToAxQY6tqz52/jKEmdFApQafmuvO8VqgELhCwaclPb7PtPeFS64kDMKOYvmeYFzpS05tDcoUiVX07fua8vW+5BcdwSVelbohOVZRxsQvt8nhUushAfFGiBnZZcJi0cq/FX4kHN2gMF5hw253YZAY8nc='
    });
  const res = await zmxyClient.initCertification('张三', '310105912123123412');
  t.is(res.result.biz_no, 'ZM201703093000000727200705771480');
});

test('Certification Query', async(t) => {
  nock('https://zmopenapi.zmxy.com.cn')
    .post('/openapi.do')
    .query(() => true)
    .reply(200, {
      encrypted: true,
      sign: {
        signSource: 'zhima_sign_value',
        signResult: 'JBSyQcJOy5O1Y3US2LJGzUIiQwauQR24IOhLA8X6mlUyLUhgLZur9RzG61NF2to25iJCj1as7eOziTOr9E4t7s+FxZ3/h6dRA1f2cGW6wolw9VGMljmbOBvNOfO/y0JfVWH2xVxRoFPThbig8fZiQ6fnYtRYWJn6c8EVJG1AzUg='
      },
      biz_response_sign: 'SP+K6ZpqsWyIY2mEFVFJlpOgl+JujaVEYB/VwO+JiUVwIe1WUhZaJpHmLpJFYFC645+Uz+IfwJoTGEr0OD8+O/B/NZbE0DZ1O07B6hvGKjm5+clMP00EZqOzanC3oUEmsAb7agBxnlZuq/4OVLztUG9Oz+aYqZJVDmcZQDXFLVY=',
      biz_response: 'RQ30EQ7I4tJJAT7AG1Xh0XDqYUBNVMgtFz62sYBKJOtrE5cgEBO1yYPaHUSLWo3Kycl7OFpXGibTKIXLbHuo9F92+aQjzHACYUDg3vK5BY7yYfiuaIPGPZ6EXkdDicPO0nEYKsU9fNXYa7ZKb/MdUFytbHQI81CDfoBkJUnx+XY='
    });
  const res = await zmxyClient.queryCertification('ZM201703093000000111100703563174');
  t.is(res.result.passed, "true");
});
