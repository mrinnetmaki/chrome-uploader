export ROLLBAR_POST_TOKEN=aaaabbbbccccddddeeeeffff00001111
sed -i '' 's/api.tidepool.org/test.sensotrend.fi\/tpapi/g' node_modules/tidepool-platform-client/tidepool.js
sed -i '' 's/uploads.tidepool.org/test.sensotrend.fi\/tpupload/g' node_modules/tidepool-platform-client/tidepool.js
sed -i '' 's/data.tidepool.org/test.sensotrend.fi\/tpdata/g' node_modules/tidepool-platform-client/tidepool.js

yarn package-mac





