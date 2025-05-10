const { mySqlQury } = require('./db')
const axios = require('axios');



async function licenseValidate(hostname) {
    try {
        // const urls = 'https://check.cscodetech.cloud/pet_ip.php';
        // const data1 = {
        //     sname: hostname
        // };

        // const response1 = await axios.post(urls, data1, {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });

        // console.log('Response 1 data:', response1.data); // Inspect the data

        // if (response1.data === false) {
        //     console.error('Error occurred: ', response1.statusText);
        //     return -1; // Return -1 if there's an error in the first response
        // } else {
        //     const vp =  response1.data;
        //     if (vp == 1) {
        //         // Continue to the next step
        //         return 1;
        //     } else {
        //         return -1; // Return -1 since we're redirecting
        //     }
        // }

        // const url = 'https://check.cscodetech.cloud/pet_domain.php';
        // const data2 = {
        //     sname: hostname
        // };

        // const response2 = await axios.post(url, data2, {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });

        return 1;
    } catch (error) {
        console.error('Error occurred: ', error);
        return -1; // Return -1 if there's an error in the try block
    }
}



// DataFind function with license validation
async function DataFind(query) {
    return await mySqlQury(query);
}



// Insert
async function DataInsert(tblname, names, values, hostname) {
    const licenseStatus = await licenseValidate(hostname);
    if (licenseStatus === 1) {
        return await mySqlQury(`INSERT INTO ${tblname} (${names}) VALUE (${values})`);
    } else {
        return -1;
    }
}

// Update
async function DataUpdate(tblname, values, where, hostname) {
    const licenseStatus = await licenseValidate(hostname);
    if (licenseStatus === 1) {
        return await mySqlQury(`UPDATE ${tblname} SET ${values} WHERE ${where}`);
    } else {
        return -1;
    }
}

// Delete
async function DataDelete(tblname, where, hostname) {
    const licenseStatus = await licenseValidate(hostname);
    if (licenseStatus === 1) {
        return await mySqlQury(`DELETE FROM ${tblname} where ${where}`);
    } else {
        return -1;
    }
}



module.exports = { DataFind, DataInsert, DataUpdate, DataDelete }