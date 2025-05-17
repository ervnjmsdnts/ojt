import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';

import Evan from '@/assets/team/evan.png';
import Des from '@/assets/team/des.jpg';
import Joreen from '@/assets/team/joreen.jpg';
import Nicole from '@/assets/team/nicole.jpg';
import AppSS from '@/assets/app-ss.png';
import { userQueryOptions } from '@/lib/api';
import BSULogo from '@/assets/bsu-logo.png';
import DECELogo from '@/assets/dece.png';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;
    let user = null;

    try {
      user = await queryClient.fetchQuery(userQueryOptions);
    } catch (error) {
      user = null;
    }

    return { user };
  },
  component: Index,
});

function Index() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  return (
    <div className='bg-white'>
      {/* Navigation */}
      <nav className='mx-auto relative z-10 flex max-w-7xl items-center justify-end p-6 lg:px-8'>
        <div className='flex flex-1 justify-end'>
          {user ? (
            <Button
              variant='link'
              onClick={() => navigate({ to: '/dashboard' })}
              className='text-sm font-semibold leading-6 text-gray-900'>
              Go to Dashboard<span aria-hidden='true'>&rarr;</span>
            </Button>
          ) : (
            <Button
              variant='link'
              onClick={() => navigate({ to: '/login' })}
              className='text-sm font-semibold leading-6 text-gray-900'>
              Log in<span aria-hidden='true'>&rarr;</span>
            </Button>
          )}
        </div>
      </nav>

      <div className='relative isolate pt-14'>
        <div
          className='absolute inset-x-0 -top-40 -z-20 transform-gpu overflow-hidden blur-3xl sm:-top-80'
          aria-hidden='true'>
          <div
            className='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] to-[#bae4df] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]'
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className='py-24 sm:py-32 lg:pb-40'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl text-center'>
              <div className='flex items-center justify-evenly'>
                <img src={BSULogo} className='w-24' />
                <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl'>
                  Student Internship Portal
                </h1>
                <img src={DECELogo} className='w-32' />
              </div>
              <p className='mt-6 text-lg leading-8 text-gray-600'>
                Transforming the On-the-Job Training experience for students at
                the Department of Electronics Engineering. Streamline your OJT
                journey with our intuitive web-based platform.
              </p>
              <div className='mt-10 flex items-center justify-center gap-x-6'>
                <Button onClick={() => navigate({ to: '/login' })}>
                  Get Started
                </Button>
                <a
                  href='#about'
                  className='text-sm font-semibold leading-6 text-gray-900'>
                  Learn more <span aria-hidden='true'>→</span>
                </a>
              </div>
            </div>
            <div className='mt-16 flow-root sm:mt-24'>
              <div className='-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4'>
                <img
                  src={AppSS}
                  alt='App screenshot'
                  width={2432}
                  height={1442}
                  className='rounded-md shadow-2xl ring-1 ring-gray-900/10'
                />
              </div>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div id='about' className='py-24 sm:py-32'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl lg:mx-0'>
              <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
                About Us
              </h2>
              <p className='mt-6 text-lg leading-8 text-gray-600'>
                Welcome to the Student Internship Portal (SIP), where we are
                transforming the On-the-Job Training (OJT) experience for
                students at the Department of Electronics Engineering (DECE).
                Our mission is simple yet powerful: to streamline and enhance
                the management of OJT programs through an intuitive web-based
                platform that fosters seamless interaction between students and
                faculty.
              </p>
              <p className='mt-6 text-lg leading-8 text-gray-600'>
                At SIP, we understand the challenges posed by traditional manual
                processes—inefficiencies, miscommunication, and delays can
                hinder the learning journey. That's why we have designed a
                user-friendly interface that makes navigating the portal a
                breeze. From tracking progress to reporting activities, our
                platform is equipped with all the tools you need to manage your
                OJT experience effectively.
              </p>
              <p className='mt-6 text-lg leading-8 text-gray-600'>
                But we're not stopping here! Our vision for the future is to
                expand our partnerships with industries and extend our services
                to other departments beyond Electronics Engineering. We believe
                that every student deserves a smooth and enriching OJT
                experience, and we are committed to making that a reality.
              </p>
            </div>
          </div>
        </div>

        {/* Meet the Team Section */}
        <div className='py-24 sm:py-32'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl lg:mx-0'>
              <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
                Meet the Team
              </h2>
            </div>
            <div className='mx-auto mt-16 grid gap-x-8 gap-y-16 max-w-none grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
              {team.map((member) => (
                <div
                  key={member.name}
                  className='flex flex-col bg-blue-400 items-center rounded-2xl p-8 w-[260px] h-[370px] mx-auto shadow-sm'>
                  <img
                    src={member.image}
                    alt={member.name}
                    className='w-40 h-40 object-cover rounded-full border border-gray-300 mb-6'
                    style={{ background: '#fff' }}
                  />
                  <div className='flex-1 flex flex-col justify-end w-full text-center'>
                    <div className='flex flex-col justify-end h-16'>
                      <h3 className='text-lg font-semibold leading-6 tracking-tight text-gray-900 mb-1 break-words h-8 flex items-center justify-center'>
                        {member.name}
                      </h3>
                      <p className='text-base leading-7 text-white h-6 flex items-center justify-center'>
                        {member.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Guide Section */}
        <div className='py-24 sm:py-32 bg-gray-50'>
          <div className='mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl lg:mx-0'>
              <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
                User Guide
              </h2>
              <p className='mt-6 text-lg leading-8 text-gray-600'>
                Welcome to the Student Internship Portal! Our comprehensive
                guide will help you navigate through your OJT journey with ease.
              </p>
            </div>

            {/* Student Interns Guide */}
            <div className='mt-16'>
              <h3 className='text-2xl font-bold tracking-tight text-gray-900'>
                For Student Interns
              </h3>
              <p className='mt-4 text-lg leading-8 text-gray-600'>
                Embarking on your internship journey is an exciting time, and
                our Student Internship Portal is designed to make your
                experience seamless and fulfilling.
              </p>

              <div className='mt-10 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2'>
                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Account Creation
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Getting started is easy! Simply register by providing your
                    details. Once your account is created, you will be required
                    to log in again for you to be able to choose an OJT
                    coordinator.
                  </p>
                </div>

                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Task Submission Process
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Navigate to the Requirements Tab to submit your essential
                    documents, including Pre-OJT, Monthly Reports, and Post-OJT
                    requirements. Ensure you keep track of your submissions, as
                    they play a crucial role in your internship evaluation.
                  </p>
                </div>

                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Progress Monitoring
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Your dashboard is your command center. Here, you can monitor
                    your approved submissions, track OJT hours, and stay updated
                    with announcements. Don't forget to check out the Chats
                    feature to communicate with your OJT Coordinator directly!
                  </p>
                </div>

                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Feedback Forms
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Your voice matters! Fill out the Student Feedback Form to
                    share your experiences. You can also send the Supervisor
                    Feedback Form and Appraisal Form to your supervisors via
                    email, fostering open communication and constructive
                    feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* OJT Coordinators Guide */}
            <div className='mt-20'>
              <h3 className='text-2xl font-bold tracking-tight text-gray-900'>
                For OJT Coordinators
              </h3>
              <p className='mt-4 text-lg leading-8 text-gray-600'>
                As an OJT Coordinator, you play a pivotal role in guiding
                student interns through their journey. The portal equips you
                with powerful tools to manage and monitor their progress
                effectively.
              </p>

              <div className='mt-10 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2'>
                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Account Management
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Your account will be set up by the admin, and you'll receive
                    your login credentials via email.
                  </p>
                </div>

                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Monitoring Student Progress
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Utilize the Dashboard Tab to keep an eye on your students'
                    progress. Here, you can post announcements, share important
                    links, and engage in chats with your students.
                  </p>
                </div>

                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Company Management
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Add and manage company information effortlessly in the
                    Company Search Tab. This feature allows you to provide
                    students with valuable resources and connections.
                  </p>
                </div>

                <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5'>
                  <h4 className='text-xl font-semibold text-gray-900'>
                    Feedback and Evaluation
                  </h4>
                  <p className='mt-4 text-base leading-7 text-gray-600'>
                    Access charts containing responses from the Student and
                    Supervisor Feedback Forms to evaluate the effectiveness of
                    the internship program. You can also edit questions in the
                    feedback forms to gather specific insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className='absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]'
          aria-hidden='true'>
          <div
            className='relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#3b82f6] to-[#bae4df] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]'
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

const team = [
  {
    name: 'Evan Gerard S. Macaraig',
    role: 'Project Leader',
    image: Evan,
  },
  {
    name: 'Andrea Joreen A. Maralit',
    role: 'Project Staff',
    image: Joreen,
  },
  {
    name: 'Deserie Aliana M. Panaligan',
    role: 'Project Staff',
    image: Des,
  },
  {
    name: 'Nicole Nash Andrea Vergara',
    role: 'Project Staff',
    image: Nicole,
  },
];
