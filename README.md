# mrdhub-site
Mr. D Classroom Resources

## Classroom student identity

Use first name, last name, and class/block entry for classroom activities and all new modules. Do not add Google sign-in to modules, Opening Bells, current events, discussions, or classroom tools. Business Canvas Studio (`ap-business/business-canvas/`) is the sole exception: preserve its Google sign-in and saved-canvas behavior. Keep teacher passcodes and teacher-only controls.

Module submissions must send `manualEntry=1` through the module collector, and show saved status only after a successful JSON acknowledgement. Preserve the certificate and offer retry on failure. Keep questions, scoring, and reflections independent of identity changes.

Opening Bell's transition also requires deploying the matching Apps Script backend; its manual-name frontend must not be activated against the older Google-only collector.
