const express = require('express');
const app = express();
const port = 8080;
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');
const path = require('path');




require('dotenv').config();
const client_id = process.env.GITHUB_CLIENT_ID;
const client_secret = process.env.GITHUB_CLIENT_SECRET;
// const redirect_uri = 'http://localhost:8080/callback';

app.use(cors({
    origin: 'http://localhost:8080',
    optionsSuccessStatus: 200
}));

//app.use(express.json())
app.use(express.static(path.join(__dirname, 'views/build')));



app.get('/auth/github/access_token', async (req, res) => {
    console.log("getting token");
    //console.log(req.query.code);
    const code = req.query.code;
    
    try {
        const response = await axios.post(`https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${code}`);
        
        const input = response.data;
        // console.log(response.data.get("access_token"));
        const parameters = input.split('&');
        
        // Find the parameter containing 'access_token='
        const accessTokenParameter = parameters.find(param => param.startsWith('access_token='));
        
        // Extract the value after '='
        const access_token = accessTokenParameter.split('=')[1];
        console.log(access_token);
        
        //console.log(access_token);
        res.json({ access_token }); // Send the access token to the frontend
    } catch (error) {
        res.status(500).json({ error: 'Failed to obtain access token' });
    }
});


app.get('/repo/pomXML', async(req, res) => {
    console.log("data recieved")
    //console.log(req.query);
    
    const repoOwner = req.query.ownerName;
    const repoName = req.query.repoName;
    const access_token = req.query.accessToken;


    //const response = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents`, { headers });
    let pom_files = [];
    await getPomXML(pom_files, 'https://api.github.com/repos/' + repoOwner + '/' + repoName + '/contents', access_token);
    
    console.log(pom_files);
    
    const response = await getDependencies(pom_files, access_token);
    
    console.log(response);
    
    res.status(200).json(response)
})


//function to handle extracting of pom.xml file from github repo
async function getPomXML(pom_files, dir_url, access_token) {
    try {
        const data = await axios.get(dir_url, {
            headers: { Authorization: `BEARER ${access_token}` },
        });
        
        for (let i = 0; i < data.data.length; i++) {
            if (data.data[i].name === "pom.xml") {
                console.log(dir_url + data.data[i].name + " found");
                pom_files.push(`${dir_url}/pom.xml`);
            } else if (data.data[i].type === "dir") {
                await getPomXML(pom_files, `${dir_url}/${data.data[i].name}`, access_token);
            }
        }
        
        // Base case: If no directories are found, return to stop the recursion
        if (data.data.every(item => item.type !== "dir")) {
            return;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function getDependencies(pom_files, access_token) {
    let response = [];
    for(let i = 0; i < pom_files.length; i++) {
        const data = await axios.get(pom_files[i], {
            headers: { Authorization: `BEARER ${access_token}` },
        });

        //console.log(data.data.content);
        const data_tmp = Buffer.from(data.data.content, 'base64');
        
        const xmlString = data_tmp.toString('utf8');
        
        const parser = new xml2js.Parser();
        
        parser.parseString(xmlString, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return;
            }
            
            if (result.project.dependencies && result.project.dependencies[0]) {
                const dependencies = result.project.dependencies[0].dependency;
                
                // Process dependencies defined under <dependencies>
                if (dependencies) {
                    //console.log('Dependencies from <dependencies>:');
                    for (const dependency of dependencies) {
                        const groupId = dependency.groupId?.[0] || 'N/A';
                        const version = dependency.version?.[0] || 'N/A';
                        response.push({groupId: groupId, version: version});
                    }
                }
            }
            
            if (result.project.dependencyManagement && result.project.dependencyManagement[0].dependencies) {
                const dependencyManagement = result.project.dependencyManagement[0].dependencies[0].dependency;
                
                // Process dependencies defined under <dependencyManagement>
                if (dependencyManagement) {
                    //console.log('\nDependencies from <dependencyManagement>:');
                    for (const dependency of dependencyManagement) {
                        const groupId = dependency.groupId?.[0] || 'N/A';
                        const version = dependency.version?.[0] || 'N/A';
                        response.push({groupId: groupId, version: version});
                    }
                }
            }
        });
    }

    return response;
}

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/build', 'index.html'));
  });


app.listen(port, () => {
    console.log(`server running on port ${port}`)
});



const temp = [{ groupId: 'javax.inject', version: 'N/A' },
{ groupId: 'javax.validation', version: 'N/A' },
{ groupId: 'org.apache.commons', version: 'N/A' },
{ groupId: 'com.fasterxml.jackson.core', version: 'N/A' },
{ groupId: 'com.fasterxml.jackson.core', version: 'N/A' },
{ groupId: 'com.fasterxml.jackson.core', version: 'N/A' },
{ groupId: 'net.sf.ehcache', version: 'N/A' },
{ groupId: 'javax.mail', version: 'N/A' },
{ groupId: 'javax.mail', version: 'N/A' },
{ groupId: 'com.googlecode.json-simple', version: 'N/A' },
{ groupId: 'mysql', version: 'N/A' },
{ groupId: 'org.junit.vintage', version: 'N/A' },
{ groupId: 'org.springframework.boot', version: 'N/A' },
{ groupId: 'org.springframework.boot', version: 'N/A' },
{ groupId: 'com.shopizer', version: '3.2.5' },
{ groupId: 'com.shopizer', version: '3.2.5' },
{ groupId: 'com.shopizer', version: '3.2.5' },
{ groupId: 'com.shopizer', version: '3.2.5' },
{ groupId: 'javax.inject', version: '${javax.inject.version}' },
{ groupId: 'org.apache.commons', version: '${commons-lang.version}' },
{ groupId: 'org.mapstruct', version: '${org.mapstruct.version}' },
{ groupId: 'io.jsonwebtoken', version: '${jwt.version}' },
{
  groupId: 'com.fasterxml.jackson.core',
  version: '${jackson-version-databind}'
},
{
  groupId: 'com.fasterxml.jackson.core',
  version: '${jackson-version}'
},
{
  groupId: 'com.fasterxml.jackson.core',
  version: '${jackson-version}'
},
{ groupId: 'javax.mail', version: '1.4.7' },
{
  groupId: 'com.googlecode.json-simple',
  version: '${simple-json-version}'
},
{ groupId: 'mysql', version: '${mysql-jdbc-version}' },
{
  groupId: 'com.google.maps',
  version: '${google-client-maps-services-version}'
},
{ groupId: 'org.kie', version: '${drools.version}' },
{ groupId: 'org.drools', version: '${drools.version}' },
{ groupId: 'org.drools', version: '${drools.version}' },
{ groupId: 'org.drools', version: '${drools.version}' },
{ groupId: 'org.kie', version: '${drools.version}' },
{ groupId: 'org.infinispan', version: '${infinispan.version}' },
{ groupId: 'org.infinispan', version: '${infinispan.tree.version}' },
{ groupId: 'org.infinispan', version: '${infinispan.version}' },
{
  groupId: 'org.apache.commons',
  version: '${commons-collections4.version}'
},
{
  groupId: 'commons-validator',
  version: '${commons-validator.version}'
},
{ groupId: 'com.amazonaws', version: '1.11.640' },
{ groupId: 'com.amazonaws', version: '1.11.640' },
{ groupId: 'com.google.cloud', version: '1.74.0' },
{ groupId: 'com.paypal.sdk', version: '2.6.109' },
{ groupId: 'com.stripe', version: '19.5.0' },
{ groupId: 'com.braintreepayments.gateway', version: '2.73.0' },
{ groupId: 'com.maxmind.geoip2', version: '${geoip2.version}' },
{ groupId: 'com.google.guava', version: '${guava.version}' },
{ groupId: 'commons-io', version: '${commons-io.version}' },
{ groupId: 'commons-fileupload', version: '${commons-fileupload}' },
{ groupId: 'io.springfox', version: '${swagger.version}' },
{ groupId: 'io.springfox', version: '${swagger.version}' },
{ groupId: 'javax.annotation', version: '${javax.annotation}' },
{ groupId: 'org.springframework.boot', version: 'N/A' },
{ groupId: 'javax.validation', version: 'N/A' },
{ groupId: 'com.fasterxml.jackson.core', version: 'N/A' },
{ groupId: 'com.fasterxml.jackson.core', version: 'N/A' },
{ groupId: 'org.json', version: '20211205' },
{ groupId: 'com.googlecode.json-simple', version: 'N/A' },
{ groupId: 'org.apache.commons', version: 'N/A' },
{ groupId: 'org.springframework', version: 'N/A' },
{ groupId: 'commons-io', version: 'N/A' },
{ groupId: 'commons-fileupload', version: 'N/A' },
{ groupId: 'com.shopizer', version: 'N/A' },
{ groupId: 'org.springframework.boot', version: 'N/A' },
{ groupId: 'org.hibernate', version: 'N/A' },
{ groupId: 'com.shopizer', version: 'N/A' },
{ groupId: 'com.shopizer', version: 'N/A' },
{ groupId: 'com.shopizer', version: '2.17.0' },
{ groupId: 'com.shopizer', version: '1.0.6' },
{ groupId: 'com.shopizer', version: '1.0.3' },
{ groupId: 'com.google.maps', version: 'N/A' },
{ groupId: 'org.kie', version: 'N/A' },
{ groupId: 'org.drools', version: 'N/A' },
{ groupId: 'org.drools', version: 'N/A' },
{ groupId: 'org.drools', version: 'N/A' },
{ groupId: 'org.kie', version: 'N/A' },
{ groupId: 'org.infinispan', version: 'N/A' },
{ groupId: 'org.infinispan', version: 'N/A' },
{ groupId: 'org.apache.commons', version: 'N/A' },
{ groupId: 'commons-validator', version: 'N/A' },
{ groupId: 'org.freemarker', version: 'N/A' },
{ groupId: 'org.springframework', version: 'N/A' },
{ groupId: 'org.apache.httpcomponents', version: 'N/A' },
{ groupId: 'com.amazonaws', version: 'N/A' },
{ groupId: 'com.amazonaws', version: 'N/A' },
{ groupId: 'com.google.cloud', version: 'N/A' },
{ groupId: 'com.paypal.sdk', version: 'N/A' },
{ groupId: 'com.stripe', version: 'N/A' },
{ groupId: 'com.braintreepayments.gateway', version: 'N/A' },
{ groupId: 'com.maxmind.geoip2', version: 'N/A' },
{ groupId: 'com.google.guava', version: 'N/A' },
{ groupId: 'org.springframework.boot', version: 'N/A' },
{ groupId: 'com.h2database', version: 'N/A' },
{ groupId: 'com.shopizer', version: 'N/A' },
{ groupId: 'org.springframework', version: 'N/A' },
{ groupId: 'org.springframework', version: 'N/A' },
{ groupId: 'javax.annotation', version: 'N/A' },
{ groupId: 'io.springfox', version: 'N/A' },
{ groupId: 'com.shopizer', version: 'N/A' },
{ groupId: 'com.shopizer', version: 'N/A' }]

//        const response = await axios.post(`https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${code}`);

