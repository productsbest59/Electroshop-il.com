import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deliveryState,deliveryError} from '../shop-delivery-policy.js';
const line=(price,quantity=1,product={})=>({price,quantity,product});
for(const price of [1,50,99.99]){
  assert.equal(deliveryState([line(price)],'shipping').allowed,false);
  assert.equal(deliveryState([line(price)],'pickup').allowed,true);
  assert.equal(deliveryState([line(price)],'pickup').shipping,0);
  assert.ok(deliveryError(deliveryState([line(price)]),'shipping'));
}
assert.equal(deliveryState([line(100)],'shipping').allowed,true);
assert.equal(deliveryError(deliveryState([line(50)]),'shipping'),'בהזמנה מתחת ל-100 ₪ ניתן לבחור איסוף עצמי.');
assert.equal(deliveryState([line(25,4)],'shipping').allowed,true);
assert.equal(deliveryState([line(33.33,3)],'shipping').allowed,false);
const phone=line(60,1,{categoryKeys:['smartphones']});
assert.equal(deliveryState([phone],'shipping').total,110);
assert.equal(deliveryState([phone],'shipping').allowed,false); // postage cannot satisfy the minimum
assert.equal(deliveryState([phone],'pickup').total,60);
assert.equal(deliveryState([line(100,1,{sku:'PELEPHONE-X'})],'shipping').total,150);
assert.equal(deliveryState([line(120,1,{pickupOnly:true})],'shipping').allowed,false);
assert.equal(deliveryState([line(120,1,{pickupOnly:true})],'pickup').allowed,true);
assert.equal(deliveryState([line(500,1,{categories:['guitars']})],'shipping').allowed,false);
assert.equal(deliveryState([line(500,1,{categories:['guitars']})],'pickup').total,500);
assert.equal(deliveryState([line(30),line(500,1,{categories:['guitars']})],'shipping').allowed,false);
assert.equal(deliveryState([],'pickup').allowed,false);
assert.equal(deliveryState([line(100)],'invalid').allowed,false);
const html=readFileSync(new URL('../shop-checkout.html',import.meta.url),'utf8');
assert.equal((html.match(/name="fulfillmentMethod"/g)||[]).length,2);
assert.ok(!html.includes('type="hidden" name="fulfillmentMethod"'));
const admin=readFileSync(new URL('../shop-admin-orders.js',import.meta.url),'utf8');
assert.ok(admin.includes('נבחר ע״י הלקוח'));
assert.ok(admin.includes('ready_for_pickup')&&admin.includes('collected'));
assert.ok(!admin.includes('data-field="fulfillment_method"')); // status updates cannot overwrite the customer's choice
console.log('Delivery policy and checkout/admin integration tests passed.');
