const express = require('express');
// const fs = require('fs');
// const multipart = require('connect-multiparty');
// let multipartMiddleware = multipart({ uploadDir: './assets/imageupload' });
const db = require('./connection/db');

const app = express();
const port = 8000;

app.set('view engine', 'hbs'); // view engine is set to handlebars

app.use('/assets', express.static(__dirname + '/assets')); // static files are served from the assets folder
app.use(express.urlencoded({ extended: false }));

let isLogin = true;

function dhm(t) {
    var cd = 24 * 60 * 60 * 1000,
        ch = 60 * 60 * 1000,
        d = Math.floor(t / cd),
        h = Math.floor((t - d * cd) / ch),
        m = Math.round((t - d * cd - h * ch) / 60000);
    if (m === 60) {
        h++;
        m = 0;
    }
    if (h === 24) {
        d++;
        h = 0;
    }

    return d;
}


const convertyyyymmdd = (date) => {
    let yyyy = new Date(date).getFullYear();
    let mm = new Date(date).getMonth() + 1;
    mm = mm < 10 ? "0" + mm : mm;
    let dd = new Date(date).getDate();
    dd = dd < 10 ? "0" + dd : dd;

    return `${yyyy}-${mm}-${dd}`;
}

const convertddmmyyyy = (date) => {
    let yyyy = new Date(date).getFullYear();
    let mm = new Date(date).getMonth() + 1;
    mm = mm < 10 ? "0" + mm : mm;
    let dd = new Date(date).getDate();

    return `${dd}-${mm}-${yyyy}`;
}

db.connect((err, client, done) => {

    if (err) throw err;

    app.get('/', (req, res) => {

        client.query(`SELECT * FROM public.tb_project`, (err, result) => {
            if (err) throw err;

            let data = result.rows.map((item) => {
                let end_date = new Date(parseInt(item.end_date));
                let start_date = new Date(parseInt(item.start_date));
                let duration = dhm(new Date(end_date) - new Date(start_date));
                duration = Math.floor(duration / 30) <= 0 ? duration + ' hari' : duration % 30 == 0 ? Math.floor(duration / 30) + ' bulan ' : Math.floor(duration / 30) + ' bulan ' + duration % 30 + ' hari';
                return {
                    ...item,
                    duration,
                    isLogin
                }
            });

            data.forEach((item) => {

                if (typeof (item.technologies) == 'string') {
                    item.technologies = [item.technologies];
                }
            });

            // console.log(data)

            res.render('index', { isLogin, data });
        });

    });

    app.get('/project-detail/:id', (req, res) => {
        let id = req.params.id;

        client.query(`SELECT * FROM public.tb_project WHERE id=${id}`, (err, result) => {
            if (err) throw err;

            let projectDetail = result.rows[0];

            let start_date = new Date(parseInt(projectDetail.start_date));
            let end_date = new Date(parseInt(projectDetail.end_date));

            let duration = dhm(end_date - start_date);
            duration = Math.floor(duration / 30) <= 0 ? duration + ' hari' : duration % 30 == 0 ? Math.floor(duration / 30) + ' bulan ' : Math.floor(duration / 30) + ' bulan ' + duration % 30 + ' hari';

            projectDetail.duration = duration;
            projectDetail.start_date = convertddmmyyyy(start_date);
            projectDetail.end_date = convertddmmyyyy(end_date);

            res.render('project-detail', { projectDetail });
        });
    });

    app.get('/contact', (req, res) => {
        res.render('contact', { isLogin });
    });

    app.get('/add-project', (req, res) => {
        res.render('add-project');
    });

    app.get('/edit-project/:id', (req, res) => {
        let id = req.params.id;
        client.query(`SELECT * FROM public.tb_project WHERE id=${id}`, (err, result) => {
            if (err) throw err;

            let project = result.rows[0];


            project.start_date = convertyyyymmdd(new Date(parseInt(project.start_date)));
            project.end_date = convertyyyymmdd(new Date(parseInt(project.end_date)));

            // console.log(project.start_date, project.end_date);

            let tech = project.technologies.toString();
            res.render('edit-project', { project, tech });
        });
    });

    app.post('/edit-project/:id', (req, res) => {
        let id = req.params.id;
        let name = req.body.name;
        let startdate = new Date(req.body.startdate).getTime();
        let enddate = new Date(req.body.enddate).getTime();
        let description = req.body.description;
        let duration = dhm(new Date(enddate) - new Date(startdate));
        duration = Math.floor(duration / 30) <= 0 ? duration + ' hari' : duration % 30 == 0 ? Math.floor(duration / 30) + ' bulan ' : Math.floor(duration / 30) + ' bulan ' + duration % 30 + ' hari';
        let technologies = req.body.technologies;
        let techstring = '';
        let userid = 1;

        if (typeof (technologies) == 'string') {
            technologies = [technologies];
        }

        for (let x = 0; x < technologies.length; x++) {
            if (x == technologies.length - 1) {
                techstring += technologies[x];
            } else {
                techstring += technologies[x] + ",";
            }
        }

        technologies = "{" + techstring + "}";
        // let imagepath = req.files.imageupload.path;
        // let imageupload = imagepath.split('\\');
        // imageupload = imageupload[imageupload.length - 1];
        let image = 'projek1.jpg';
        // console.log(imageupload);
        // console.log(tech);

        let query = `UPDATE public.tb_project SET name='${name}', start_date=${startdate}, end_date=${enddate}, description='${description}', technologies='${technologies}', image='${image}', user_id=${userid} WHERE id=${id}`;

        client.query(query, (err, result) => {
            if (err) throw err;

            // console.log(result);
            res.redirect('/');
        });
    });

    app.post('/add-project', (req, res) => {
        let name = req.body.name;
        let startdate = new Date(req.body.startdate).getTime();
        let enddate = new Date(req.body.enddate).getTime();
        let description = req.body.description;
        let technologies = req.body.technologies;
        let techstring = '';
        let userid = 1;

        if (typeof (technologies) == 'string') {
            technologies = [technologies];
        }

        for (let x = 0; x < technologies.length; x++) {
            if (x == technologies.length - 1) {
                techstring += technologies[x];
            } else {
                techstring += technologies[x] + ",";
            }
        }

        technologies = "{" + techstring + "}";

        // return console.log(technologies);

        // let imagepath = req.files.imageupload.path;
        // let imageupload = imagepath.split('\\');
        // imageupload = imageupload[imageupload.length - 1];
        let image = 'projek1.jpg';

        // return console.log(name, startdate, enddate, description, technologies, image);
        // console.log(imageupload[imageupload.length - 1]);

        client.query(`INSERT INTO public.tb_project(name, start_date, end_date, description, technologies, image, user_id) VALUES('${name}',${startdate},${enddate},'${description}','${technologies}','${image}', ${userid});`, (err, result) => {
            if (err) throw err;

            // console.log(result);
            res.redirect('/');
        });

    });

    app.get('/delete-project/:id', (req, res) => {
        let id = req.params.id;

        client.query(`DELETE FROM public.tb_project WHERE id=${id}`, (err, result) => {
            if (err) throw err;
        });

        client.query(`SELECT * FROM public.tb_project WHERE id=${id}`, (err, result) => {
            if (err) throw err;

            // let dataSelected = result.rows[0];

            // fs.unlinkSync(`assets/imageupload/${dataSelected.imageupload}`);

        });

        res.redirect('/');
    });

});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

