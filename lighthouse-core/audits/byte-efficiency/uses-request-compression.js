/**
 * @license
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
/*
 * @fileoverview Audit a page to ensure that resources loaded with
 * gzip/br/deflate compression.
 */
'use strict';

const Audit = require('./byte-efficiency-audit');
const URL = require('../../lib/url-shim');

const IGNORE_THRESHOLD_IN_BYTES = 1400;
const TOTAL_WASTED_BYTES_THRESHOLD = 1000 * 1024; // 1KB

class ResponsesAreCompressed extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Performance',
      name: 'uses-request-compression',
      description: 'Server responses are compressed using GZIP, BROTLI or DEFLATE.',
      helpText: 'Requests should be optimized to save network bytes.' +
        ' [Learn more](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/optimize-encoding-and-transfer).',
      requiredArtifacts: ['ResponseCompression', 'networkRecords']
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @param {number} networkThroughput
   * @return {!AuditResult}
   */
  static audit_(artifacts) {
    const uncompressedResponses = artifacts.ResponseCompression;

    let totalWastedBytes = 0;
    const results = uncompressedResponses.reduce((results, record) => {
      const originalSize = record.resourceSize;
      const gzipSize = record.gzipSize;
      const gzipSavings = originalSize - gzipSize;

      // allow a pass if we don't get 10% savings or less than 1400 bytes
      if (gzipSize / originalSize > 0.9 || gzipSavings < IGNORE_THRESHOLD_IN_BYTES) {
        return results;
      }

      totalWastedBytes += gzipSavings;
      const url = URL.getDisplayName(record.url);
      const totalBytes = originalSize;
      const gzipSavingsBytes = gzipSavings;
      const gzipSavingsPercent = 100 * gzipSavingsBytes / totalBytes;
      results.push({
        url,
        totalBytes,
        wastedBytes: gzipSavingsBytes,
        wastedPercent: gzipSavingsPercent,
        gzipSavings: this.toSavingsString(gzipSavingsBytes, gzipSavingsPercent),
      });

      return results;
    }, []);

    let debugString;
    return {
      passes: totalWastedBytes < TOTAL_WASTED_BYTES_THRESHOLD,
      debugString,
      results,
      tableHeadings: {
        url: 'URL',
        totalKb: 'Original',
        gzipSavings: 'GZIP Savings',
      }
    };
  }
}

module.exports = ResponsesAreCompressed;
