const fs = require('fs');
const apps = ['admin-app', 'super-admin-app'];
apps.forEach(app => {
  const files = [
    `d:/Jobdozo/jobdozo/${app}/src/components/layout/PortalShell.tsx`,
    `d:/Jobdozo/jobdozo/${app}/src/components/layout/Sidebar.tsx`,
    `d:/Jobdozo/jobdozo/${app}/src/components/layout/Topbar.tsx`,
    `d:/Jobdozo/jobdozo/${app}/src/components/pages/DashboardPage.tsx`
  ];
  files.forEach(f => {
    if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf8');
      content = content.replace(/usePortalData/g, 'useEmployerData');
      content = content.replace(/PortalDataContext/g, 'EmployerDataContext');
      content = content.replace(/PortalDataProvider/g, 'EmployerDataProvider');
      fs.writeFileSync(f, content, 'utf8');
    }
  });
});
