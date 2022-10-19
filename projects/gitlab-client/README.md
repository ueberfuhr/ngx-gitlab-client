# Gitlab Client for Angular

This Gitlab Client provides Angular-based services to
call the [Gitlab REST API](https://docs.gitlab.com/ee/api/index.html).

## Configuration

We have to import the `GitlabClientModule` to make the services injectable.
For that, we need to define how to access Gitlab, i.e. which
host and security token to use.

### Static Gitlab Connection

We can easily configure the Gitlab connection with the following import:

```typescript
@NgModule({
  imports: [
    GitlabClientModule.forRoot({
      host: 'https://mygitlabhost/',
      token: 'mygitlabtoken'
    })
  ]
})
export class MyModule {
}
```

### Dynamic Gitlab Connection

If the Gitlab connection is calculated during runtime and provided by a custom service,
we can import the `GitlabClientModule` directly and then have to provide a `GITLAB_CONNECTION_PROVIDER`:

```typescript
@Injectable({providedIn: 'root'})
export class MyGitlabConfigService {

  readConfiguration(): GitlabConfig {
    // ...
  }

}

@NgModule({
  imports: [
    GitlabClientModule
  ],
  providers: [
    {
      provide: GITLAB_CONFIG_PROVIDER,
      useFactory: (service: MyGitlabConfigService) => service.readConfiguration,
      deps: [MyGitlabConfigService],
    }
  ]
})
export class MyModule {
}
```

