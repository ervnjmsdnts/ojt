import PageHeaderText from '@/components/page-header-text';
import { SidebarInset } from '@/components/ui/sidebar';
import { createFileRoute } from '@tanstack/react-router';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const Route = createFileRoute('/_authenticated/faq')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  return (
    <SidebarInset className='py-4 px-8 flex flex-col gap-4'>
      <PageHeaderText>FAQ</PageHeaderText>
      {user.role === 'student' ? (
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>How do I track my OJT progress?</AccordionTrigger>
            <AccordionContent>
              You can track your OJT progress through the “Dashboard”, which
              provides a clear overview of your Pre-OJT, OJT, and Post-OJT
              requirements. Simply log in to your account using your username
              and password. Once inside, navigate to the “Requirements” tab to
              view the status of each submission (e.g., Pending, Approved,
              Resubmit). The dashboard is designed to help you easily monitor
              and manage your internship requirements at every stage.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>
              How can I find companies offering internships?
            </AccordionTrigger>
            <AccordionContent>
              Go to the "Company search" tab. You can search through the names
              of the companies readily listed on the portal. You can also view
              their addresses and Memorandum of Agreement.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>
              What documents can I upload or download from the portal?
            </AccordionTrigger>
            <AccordionContent>
              By accessing the “Requirements” tab, you can browse the documents
              required to be submitted at each OJT stage. (Required File Type:
              PDF or .pdf)
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-4'>
            <AccordionTrigger>How do I log my OJT hours?</AccordionTrigger>
            <AccordionContent>
              Go to the “Reports” tab and input your working hours by clicking
              the Daily Report button and fill in the information needed. You
              can generate the Monthly Report by clicking the Monthly Report
              button and by selecting the month for the report to be generated.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-5'>
            <AccordionTrigger>
              How do I edit my profile information?
            </AccordionTrigger>
            <AccordionContent>
              By accessing the “Profile” tab, you can edit the information
              provided in the portal.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <Accordion type='single' collapsible>
          <AccordionItem value='item-1'>
            <AccordionTrigger>
              How do I accept student enrollees?
            </AccordionTrigger>
            <AccordionContent>
              By accessing the “Requests” tab, you can view students that are
              enrolling in your class. You have the option to Approve or
              Disapprove their requests. You can also view their registration
              forms as a proof of enrollment at the University.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>
              How can I monitor student interns&apos; progress?
            </AccordionTrigger>
            <AccordionContent>
              The “Dashboard” allows you to view how many students there are in
              each OJT stage. By accessing the “OJTs” tab, you can view students
              that are currently enrolled in your class, their OJT hours, and
              the documents they have submitted.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>
              How can I post Announcements and Links?
            </AccordionTrigger>
            <AccordionContent>
              The “Dashboard” allows you to add notifications and links by
              simply clicking the Add button and setting its details. You can
              either post announcements for all of the students or for specific
              students only.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-4'>
            <AccordionTrigger>
              How can I view the summary of responses for each feedback form?
            </AccordionTrigger>
            <AccordionContent>
              By navigating to the “Feedback Summary” tab, you can view the
              summary of responses for each feedback form (e.g. Student-Trainee
              Feedback Form and Supervisor Feedback Form). You can also filter
              it depending on the program or academic year.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-5'>
            <AccordionTrigger>
              How do I edit my profile information?
            </AccordionTrigger>
            <AccordionContent>
              By accessing the “Profile” tab, you can edit the information
              provided in the portal.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </SidebarInset>
  );
}
