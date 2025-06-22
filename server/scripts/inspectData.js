const mongoose = require('mongoose');
const { Frequency, Duration } = require('../models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function inspectData() {
  try {
    console.log('Inspecting frequency and duration data...\n');

    // Check all frequency records
    const allFrequencies = await Frequency.find({});
    console.log(`Total frequency records: ${allFrequencies.length}`);
    
    const templateFrequencies = allFrequencies.filter(f => f.isTemplate);
    const studentFrequencies = allFrequencies.filter(f => !f.isTemplate);
    
    console.log(`Template frequencies: ${templateFrequencies.length}`);
    console.log(`Student frequencies: ${studentFrequencies.length}\n`);

    console.log('Template frequencies:');
    templateFrequencies.forEach(f => {
      console.log(`- ${f.behaviorTitle}: ${f.operationalDefinition || 'NO OPERATIONAL DEFINITION'}`);
    });

    console.log('\nStudent frequencies:');
    studentFrequencies.forEach(f => {
      console.log(`- ${f.behaviorTitle}: ${f.operationalDefinition || 'NO OPERATIONAL DEFINITION'} (templateId: ${f.templateId})`);
    });

    // Check all duration records
    const allDurations = await Duration.find({});
    console.log(`\nTotal duration records: ${allDurations.length}`);
    
    const templateDurations = allDurations.filter(d => d.isTemplate);
    const studentDurations = allDurations.filter(d => !d.isTemplate);
    
    console.log(`Template durations: ${templateDurations.length}`);
    console.log(`Student durations: ${studentDurations.length}\n`);

    console.log('Template durations:');
    templateDurations.forEach(d => {
      console.log(`- ${d.behaviorTitle}: ${d.operationalDefinition || 'NO OPERATIONAL DEFINITION'}`);
    });

    console.log('\nStudent durations:');
    studentDurations.forEach(d => {
      console.log(`- ${d.behaviorTitle}: ${d.operationalDefinition || 'NO OPERATIONAL DEFINITION'} (templateId: ${d.templateId})`);
    });

  } catch (error) {
    console.error('Error inspecting data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
inspectData(); 