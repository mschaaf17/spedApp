const mongoose = require('mongoose');
const { Frequency, Duration } = require('../models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/spedApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixOperationalDefinitions() {
  try {
    console.log('Starting to fix operational definitions...');

    // Fix frequency records
    const frequencies = await Frequency.find({ isTemplate: false });
    console.log(`Found ${frequencies.length} non-template frequency records`);

    for (const frequency of frequencies) {
      if (!frequency.operationalDefinition && frequency.templateId) {
        // Find the template
        const template = await Frequency.findById(frequency.templateId);
        if (template && template.operationalDefinition) {
          // Update the frequency record
          await Frequency.findByIdAndUpdate(frequency._id, {
            operationalDefinition: template.operationalDefinition
          });
          console.log(`Updated frequency "${frequency.behaviorTitle}" with operational definition: "${template.operationalDefinition}"`);
        } else {
          console.log(`No template found for frequency "${frequency.behaviorTitle}" or template has no operational definition`);
        }
      } else if (!frequency.operationalDefinition) {
        console.log(`Frequency "${frequency.behaviorTitle}" has no templateId, cannot fix`);
      }
    }

    // Fix duration records
    const durations = await Duration.find({ isTemplate: false });
    console.log(`Found ${durations.length} non-template duration records`);

    for (const duration of durations) {
      if (!duration.operationalDefinition && duration.templateId) {
        // Find the template
        const template = await Duration.findById(duration.templateId);
        if (template && template.operationalDefinition) {
          // Update the duration record
          await Duration.findByIdAndUpdate(duration._id, {
            operationalDefinition: template.operationalDefinition
          });
          console.log(`Updated duration "${duration.behaviorTitle}" with operational definition: "${template.operationalDefinition}"`);
        } else {
          console.log(`No template found for duration "${duration.behaviorTitle}" or template has no operational definition`);
        }
      } else if (!duration.operationalDefinition) {
        console.log(`Duration "${duration.behaviorTitle}" has no templateId, cannot fix`);
      }
    }

    console.log('Finished fixing operational definitions!');
  } catch (error) {
    console.error('Error fixing operational definitions:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
fixOperationalDefinitions(); 