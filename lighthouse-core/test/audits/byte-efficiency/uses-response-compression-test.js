/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const KB_BYTES = 1024;
const ResponsesAreCompressedAudit =
  require('../../../audits/byte-efficiency/uses-request-compression.js');
const assert = require('assert');

function generateResponse(filename, type, originalSize, gzipSize) {
  return {
    url: `http://google.com/${filename}`,
    mimeType: `${type}`,
    resourceSize: originalSize,
    gzipSize,
  };
}

/* eslint-env mocha */

describe('Page uses optimized responses', () => {
  it('fails when reponses are collectively unoptimized', () => {
    const auditResult = ResponsesAreCompressedAudit.audit_({
      ResponseCompression: [
        generateResponse('index.js', 'text/javascript', 100 * KB_BYTES, 90 * KB_BYTES),
        generateResponse('index.css', 'text/css', 50 * KB_BYTES, 37 * KB_BYTES),
        generateResponse('index.json', 'application/json', 2048 * KB_BYTES, 1024 * KB_BYTES),
      ],
    });

    assert.equal(auditResult.passes, false);
  });

  it('passes when all reponses are sufficiently optimized', () => {
    const auditResult = ResponsesAreCompressedAudit.audit_({
      ResponseCompression: [
        generateResponse('index.js', 'text/javascript', 1000 * KB_BYTES, 910 * KB_BYTES),
        generateResponse('index.css', 'text/css', 50 * KB_BYTES, 40 * KB_BYTES),
        generateResponse('index.json', 'application/json', 10 * KB_BYTES, 5 * KB_BYTES),
      ],
    });

    assert.equal(auditResult.passes, true);
  });
});
