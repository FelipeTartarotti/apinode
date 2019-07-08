const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const Project = require('../models/project');
const Device = require('../models/device');

router.use(authMiddleware);

router.get('/',async (req,res)=>{
    try{

        const projects = await Project.find().populate(['devices','user']);
        return res.send({projects})

    }catch(err){
        return res.status(400).send({error: '_Error loading projects_'});
    }
});

router.get('/:userId', async (req,res) =>{
    try{

        if(req.userId.toString() != req.params.userId.toString()){
            return res.status(400).send({error: 'Invalid User ID '});
        }
    
        const project = await Project.findOne({user: req.params.userId}).populate(['devices','user']);
        return res.send({project})

    }catch(err){
        return res.status(400).send({error: '_Error loading project_'});
    }
});

router.post('/:userId', async (req,res)=>{
    try{

        const {devices} = req.body;

        if(req.userId.toString() != req.params.userId.toString()){
            return res.status(400).send({error: 'Invalid User ID '});
        }

        const project = await Project.create({ user: req.params.userId});
       
        await Promise.all(devices.map(async device =>{
            const projectDevice = new Device({...device,project:project._id});
         
            await projectDevice.save();

            project.devices.push(projectDevice);
        }));

        await project.save();
        
        return res.send({project});

    }catch(err){
        return res.status(400).send({error: 'Error creating new project'});
    }
});

router.put('/:projectId/:userId', async (req,res)=>{
    try{
        const {devices} = req.body;

        if(req.userId.toString() != req.params.userId.toString()){
            return res.status(400).send({error: 'Invalid User Id'});
        }

        const project = await Project.findByIdAndUpdate(req.params.projectId, {},{new:true});

        project.devices = [];

        await Device.remove({project: project._id});
       
        await Promise.all(devices.map(async device =>{
            const projectDevice = new Device({...device,project:project._id});
         
            await projectDevice.save();

            project.devices.push(projectDevice);
        }));

        await project.save();
        
        return res.send({project});

    }catch(err){
        console.log(err);
        return res.status(400).send({error: 'Error updating new project'});
    }
});

router.put('/:projectId/:userId/:deviceId', async (req,res)=>{
    try{
        const {devices} = req.body;

        if(req.userId.toString() != req.params.userId.toString()){
            return res.status(400).send({error: 'Invalid User Id'});
        }

        const project = await Project.findByIdAndUpdate(
            req.params.projectId,
            {$push: { devices: { $in: req.params.deviceId }}});

        await project.save();
        
        return res.send({project});

    }catch(err){
        console.log(err);
        return res.status(400).send({error: 'Error updating new project'});
    }
});

router.delete('/:deviceId/:userId', async (req,res)=>{
  
    try{

        if(req.userId.toString() != req.params.userId.toString()){
            return res.status(400).send({error: 'Invalid User Id'});
        }

        const project = await Device.findByIdAndRemove(req.params.deviceId);
 
        return res.send(project);

    }catch(err){
        return res.status(400).send({error: '_Error deleting project_'});

    }
});

router.delete('/device/:deviceId/:projectId/:userId', async (req,res)=>{

    try{

        if(req.userId.toString() != req.params.userId.toString()){
            return res.status(400).send({error: 'Invalid User Id'});
        }

        const project = await Project.findByIdAndUpdate(
            req.params.projectId,
            {$pull: { devices: { $in: req.params.deviceId }}});
        return res.send(project);

    }catch(err){
        return res.status(400).send({error: '_Error deleting device_from project'});
    }
});

module.exports = app => app.use('/projects',router);



/*$currentDate 	Sets the value of a field to current date, either as a Date or a Timestamp.
$inc 	Increments the value of the field by the specified amount.
$min 	Only updates the field if the specified value is less than the existing field value.
$max 	Only updates the field if the specified value is greater than the existing field value.
$mul 	Multiplies the value of the field by the specified amount.
$rename 	Renames a field.
$set 	Sets the value of a field in a document.
$setOnInsert 	Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents.
$unset 	Removes the specified field from a document.

Update Operators
Name 	Description
$ 	Acts as a placeholder to update the first element that matches the query condition.
$[] 	Acts as a placeholder to update all elements in an array for the documents that match the query condition.
$[<identifier>] 	Acts as a placeholder to update all elements that match the arrayFilters condition for the documents that match the query condition.
$addToSet 	Adds elements to an array only if they do not already exist in the set.
$pop 	Removes the first or last item of an array.
$pull 	Removes all array elements that match a specified query.
$push 	Adds an item to an array.
$pullAll 	Removes all matching values from an array.
Update Operator Modifiers
Name 	Description
$each 	Modifies the $push and $addToSet operators to append multiple items for array updates.
$position 	Modifies the $push operator to specify the position in the array to add elements.
$slice 	Modifies the $push operator to limit the size of updated arrays.
$sort 	Modifies the $push operator to reorder documents stored in an array.

*/