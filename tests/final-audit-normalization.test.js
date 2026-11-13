import test from 'node:test';
import assert from 'node:assert/strict';
import { isOnlyExpectedStaticPost501 } from './final-audit-normalization.mjs';

test('accepts only the local Python static-server POST 501 limitation',()=>{
 assert.equal(isOnlyExpectedStaticPost501("Failed to load resource: the server responded with a status of 501 (Unsupported method ('POST')) http://127.0.0.1:4173/api/analytics"),true);
});
test('rejects a mixed 404 and 501 on one line',()=>{
 assert.equal(isOnlyExpectedStaticPost501("POST returned 404 and 501 (Unsupported method ('POST')) http://127.0.0.1:4173/api/fx"),false);
});
test('rejects a 404 on a separate line',()=>{
 assert.equal(isOnlyExpectedStaticPost501("501 Unsupported method ('POST') http://127.0.0.1:4173/api/analytics\nGET http://127.0.0.1:4173/api/fx 404"),false);
});
test('rejects JavaScript runtime errors accompanying a 501',()=>{
 for(const error of ['Uncaught Error: failed','TypeError: x is not a function','ReferenceError: missing','SyntaxError: invalid']) {
  assert.equal(isOnlyExpectedStaticPost501("501 Unsupported method ('POST') http://127.0.0.1:4173/api/analytics\n"+error),false);
 }
});
test('rejects non-501 HTTP errors',()=>{
 for(const status of [400,403,404,405,429,500,502,503]) {
  assert.equal(isOnlyExpectedStaticPost501(status+" Unsupported method ('POST') http://127.0.0.1:4173/api/analytics"),false);
 }
});
test('rejects remote 501 responses and non-POST limitations',()=>{
 assert.equal(isOnlyExpectedStaticPost501("501 Unsupported method ('POST') https://api.example.com/api/analytics"),false);
 assert.equal(isOnlyExpectedStaticPost501("GET 501 Unsupported method ('GET') http://127.0.0.1:4173/api/analytics"),false);
});
test('rejects empty, missing-status and unrelated details',()=>{
 for(const value of ['',null,'POST failed','JavaScript error 501','501 POST']) assert.equal(isOnlyExpectedStaticPost501(value),false);
});
